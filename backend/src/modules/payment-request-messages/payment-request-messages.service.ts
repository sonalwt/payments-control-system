import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaymentRequestMessage, MessageAttachment } from './payment-request-message.entity';

export interface Participant {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

@Injectable()
export class PaymentRequestMessagesService {
  constructor(
    @InjectRepository(PaymentRequestMessage)
    private readonly repo: Repository<PaymentRequestMessage>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Returns true if the user is a participant of the payment request:
   *   - maker (created_by)
   *   - a specific-user approver (payment_request_approvals USER type)
   *   - holds a role matching a ROLE-type approver step
   *   - treasury maker / checker / authoriser (by user ID or by treasury role)
   *   - platform admin
   */
  async canAccess(paymentRequestId: string, userId: string): Promise<boolean> {
    const result = await this.dataSource.query<{ found: string }[]>(
      `
      SELECT 1 AS found
      FROM payment_requests pr
      LEFT JOIN payment_request_approvals pra ON pra.payment_request_id = pr.id
      LEFT JOIN users u ON u.id = $2
      LEFT JOIN user_roles ur ON ur.user_id = $2
      WHERE pr.id = $1
        AND pr.deleted_at IS NULL
        AND (
          -- Maker
          pr.created_by = $2
          -- Specific-user approver step
          OR pra.approver_user_id = $2
          -- Role-based approver step
          OR (pra.approver_type = 'ROLE' AND pra.approver_role_id = ur.role_id)
          -- Treasury stage: specific user who acted
          OR pr.treasury_maker_by = $2
          OR pr.treasury_checker_by = $2
          OR pr.treasury_authoriser_by = $2
          -- Treasury stage: role-based (snapshotted roles)
          OR (pr.treasury_maker_role_id IS NOT NULL AND pr.treasury_maker_role_id = ur.role_id)
          OR (pr.treasury_checker_role_id IS NOT NULL AND pr.treasury_checker_role_id = ur.role_id)
          OR (pr.treasury_authoriser_role_id IS NOT NULL AND pr.treasury_authoriser_role_id = ur.role_id)
          -- Global treasury team (always included regardless of whether treasury stage is reached)
          OR EXISTS (
            SELECT 1 FROM user_roles ur2
            JOIN roles r2 ON r2.id = ur2.role_id
            WHERE ur2.user_id = $2
              AND r2.code IN ('TREASURY_MAKER_ONLINE','TREASURY_MAKER_OFFLINE','TREASURY_CHECKER','TREASURY_AUTHORISER')
          )
          -- Platform admin
          OR u.is_platform_admin = true
        )
      LIMIT 1
      `,
      [paymentRequestId, userId],
    );
    return result.length > 0;
  }

  /**
   * Returns the list of OTHER participants for a payment request (excluding the caller).
   *
   * Sources:
   *  1. Maker (created_by)
   *  2. Approval-chain from payment_request_approvals (exists after submission)
   *  2b. Approval-chain from approval matrix (fallback for DRAFT / supplemental for all)
   *  3. Treasury stage: specific users who acted + all holders of treasury roles
   */
  async getParticipants(paymentRequestId: string, userId: string): Promise<Participant[]> {
    const prRows = await this.dataSource.query<{ id: string; deleted_at: string | null }[]>(
      `SELECT id, deleted_at FROM payment_requests WHERE id = $1 LIMIT 1`,
      [paymentRequestId],
    );
    if (!prRows.length || prRows[0].deleted_at) {
      throw new NotFoundException('Payment request not found');
    }

    if (!(await this.canAccess(paymentRequestId, userId))) {
      throw new ForbiddenException('You are not a participant of this payment request');
    }

    // 1. Maker
    const makerRows = await this.dataSource.query<{ id: string; full_name: string; email: string }[]>(
      `SELECT u.id, u.full_name, u.email
       FROM payment_requests pr
       JOIN users u ON u.id = pr.created_by
       WHERE pr.id = $1 AND pr.created_by IS NOT NULL AND u.id != $2`,
      [paymentRequestId, userId],
    );

    // 2. USER-type approval-chain steps (from payment_request_approvals — exists after submission)
    const userApprovers = await this.dataSource.query<{
      id: string; full_name: string; email: string; step_order: number;
    }[]>(
      `SELECT DISTINCT u.id, u.full_name, u.email, pra.step_order
       FROM payment_request_approvals pra
       JOIN users u ON u.id = pra.approver_user_id
       WHERE pra.payment_request_id = $1
         AND pra.approver_type = 'USER'
         AND u.id != $2
       ORDER BY pra.step_order`,
      [paymentRequestId, userId],
    );

    // 3. ROLE-type approval-chain steps from payment_request_approvals
    const roleApprovers = await this.dataSource.query<{
      id: string; full_name: string; email: string; step_order: number; role_name: string;
    }[]>(
      `SELECT DISTINCT u.id, u.full_name, u.email, pra.step_order, r.name AS role_name
       FROM payment_request_approvals pra
       JOIN roles r ON r.id = pra.approver_role_id
       JOIN user_roles ur ON ur.role_id = pra.approver_role_id
       JOIN users u ON u.id = ur.user_id
                    AND u.is_active = true
                    AND u.deleted_at IS NULL
                    AND u.is_platform_admin = false
       WHERE pra.payment_request_id = $1
         AND pra.approver_type = 'ROLE'
         AND u.id != $2
       ORDER BY pra.step_order`,
      [paymentRequestId, userId],
    );

    // 2b. Approval-chain from the approval matrix.
    //
    //     For DRAFT payment requests, payment_request_approvals does not exist yet
    //     (rows are only created on submission). We look up the matrix directly so
    //     that approver names always appear in the @mention list regardless of status.
    //
    //     Logic:
    //       - If the PR has a snapshotted matrix_id (submitted), use that matrix.
    //       - Otherwise find the active matrix for this payment_type + currency.
    //       - Find the band covering the PR's amount.
    //       - Return all USER/ROLE step members for that band.
    const matrixApprovers = await this.dataSource.query<{
      id: string; full_name: string; email: string; step_order: number; role_name: string | null;
    }[]>(
      `
      WITH pr_info AS (
        SELECT payment_type_id, currency_id, amount, matrix_id
        FROM payment_requests
        WHERE id = $1 AND deleted_at IS NULL
      ),
      target_matrix AS (
        SELECT am.id
        FROM approval_matrices am
        JOIN pr_info pr ON (
          (pr.matrix_id IS NOT NULL AND am.id = pr.matrix_id)
          OR (
            pr.matrix_id IS NULL
            AND am.payment_type_id = pr.payment_type_id
            AND am.currency_id    = pr.currency_id
            AND am.is_active      = true
            AND am.effective_from <= CURRENT_DATE
            AND (am.effective_to IS NULL OR am.effective_to >= CURRENT_DATE)
          )
        )
        LIMIT 1
      ),
      applicable_band AS (
        SELECT amb.id
        FROM target_matrix tm
        JOIN approval_matrix_bands amb ON amb.matrix_id = tm.id
        JOIN pr_info pr ON (
          amb.min_amount <= pr.amount
          AND (amb.max_amount IS NULL OR amb.max_amount >= pr.amount)
        )
        LIMIT 1
      ),
      user_steps AS (
        SELECT DISTINCT u.id, u.full_name, u.email, ams.step_order, NULL::text AS role_name
        FROM applicable_band ab
        JOIN approval_matrix_steps ams ON ams.band_id = ab.id AND ams.approver_type = 'USER'
        JOIN users u ON u.id = ams.approver_user_id
        WHERE u.id != $2
          AND u.deleted_at IS NULL
      ),
      role_steps AS (
        SELECT DISTINCT u.id, u.full_name, u.email, ams.step_order, r.name AS role_name
        FROM applicable_band ab
        JOIN approval_matrix_steps ams ON ams.band_id = ab.id AND ams.approver_type = 'ROLE'
        JOIN roles r ON r.id = ams.approver_role_id
        JOIN user_roles ur ON ur.role_id = ams.approver_role_id
        JOIN users u ON u.id = ur.user_id
          AND u.is_active = true
          AND u.deleted_at IS NULL
          AND u.is_platform_admin = false
        WHERE u.id != $2
      )
      SELECT id, full_name, email, step_order, role_name FROM user_steps
      UNION
      SELECT id, full_name, email, step_order, role_name FROM role_steps
      ORDER BY step_order
      `,
      [paymentRequestId, userId],
    );

    // 4. Treasury: specific users who acted (treasury_maker_by / checker / authoriser)
    const treasuryActors = await this.dataSource.query<{
      id: string; full_name: string; email: string; tt_role: string;
    }[]>(
      `SELECT u.id, u.full_name, u.email,
              CASE
                WHEN pr.treasury_maker_by      = u.id THEN 'Treasury Maker'
                WHEN pr.treasury_checker_by    = u.id THEN 'Treasury Checker'
                WHEN pr.treasury_authoriser_by = u.id THEN 'Treasury Authoriser'
              END AS tt_role
       FROM payment_requests pr
       JOIN users u ON u.id IN (
         pr.treasury_maker_by,
         pr.treasury_checker_by,
         pr.treasury_authoriser_by
       )
       WHERE pr.id = $1
         AND u.id != $2
         AND u.deleted_at IS NULL`,
      [paymentRequestId, userId],
    );

    // 5. Treasury: role-based (snapshotted treasury roles → all holders)
    const treasuryRoleUsers = await this.dataSource.query<{
      id: string; full_name: string; email: string; tt_role: string;
    }[]>(
      `SELECT DISTINCT u.id, u.full_name, u.email,
              CASE
                WHEN pr.treasury_maker_role_id      = ur.role_id THEN 'Treasury Maker'
                WHEN pr.treasury_checker_role_id    = ur.role_id THEN 'Treasury Checker'
                WHEN pr.treasury_authoriser_role_id = ur.role_id THEN 'Treasury Authoriser'
              END AS tt_role
       FROM payment_requests pr
       JOIN user_roles ur ON ur.role_id IN (
         pr.treasury_maker_role_id,
         pr.treasury_checker_role_id,
         pr.treasury_authoriser_role_id
       )
       JOIN users u ON u.id = ur.user_id
                    AND u.is_active = true
                    AND u.deleted_at IS NULL
                    AND u.is_platform_admin = false
       WHERE pr.id = $1
         AND u.id != $2
         AND (
           pr.treasury_maker_role_id IS NOT NULL
           OR pr.treasury_checker_role_id IS NOT NULL
           OR pr.treasury_authoriser_role_id IS NOT NULL
         )`,
      [paymentRequestId, userId],
    );

    // 6. Global treasury team — all active non-admin holders of treasury roles,
    //    always shown regardless of whether the treasury stage has been reached yet.
    const globalTreasuryUsers = await this.dataSource.query<{
      id: string; full_name: string; email: string; tt_role: string;
    }[]>(
      `SELECT DISTINCT u.id, u.full_name, u.email, r.name AS tt_role
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       JOIN users u ON u.id = ur.user_id
                    AND u.is_active = true
                    AND u.deleted_at IS NULL
                    AND u.is_platform_admin = false
       WHERE r.code IN ('TREASURY_MAKER_ONLINE','TREASURY_MAKER_OFFLINE','TREASURY_CHECKER','TREASURY_AUTHORISER')
         AND u.id != $1`,
      [userId],
    );

    // ── Merge & deduplicate (collect IDs first, treasury roles kept as-is) ─
    const seen = new Set<string>();
    // Store treasury-role participants separately so their label is preserved.
    const treasurySet = new Set<string>();
    const raw: { id: string; fullName: string; email: string; role: string }[] = [];

    const addRaw = (id: string, fullName: string, email: string, role: string, isTreasury = false) => {
      if (!seen.has(id)) {
        seen.add(id);
        if (isTreasury) treasurySet.add(id);
        raw.push({ id, fullName, email, role });
      }
    };

    for (const m of makerRows) addRaw(m.id, m.full_name, m.email, 'Maker');
    for (const a of userApprovers) addRaw(a.id, a.full_name, a.email, 'Approver');
    for (const a of roleApprovers) addRaw(a.id, a.full_name, a.email, 'Approver');
    for (const a of matrixApprovers) addRaw(a.id, a.full_name, a.email, 'Approver');
    for (const t of treasuryActors) addRaw(t.id, t.full_name, t.email, t.tt_role, true);
    for (const t of treasuryRoleUsers) addRaw(t.id, t.full_name, t.email, t.tt_role, true);
    for (const t of globalTreasuryUsers) addRaw(t.id, t.full_name, t.email, t.tt_role, true);

    // ── Fetch actual assigned role names from user_roles for non-treasury ──
    const nonTreasuryIds = raw.filter((p) => !treasurySet.has(p.id)).map((p) => p.id);
    let userRoleMap = new Map<string, string>();
    if (nonTreasuryIds.length > 0) {
      const userRoleRows = await this.dataSource.query<{ user_id: string; role_name: string }[]>(
        `SELECT ur.user_id, r.name AS role_name
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ANY($1)
         ORDER BY r.name`,
        [nonTreasuryIds],
      );
      // Build map: user_id → comma-separated role names
      for (const row of userRoleRows) {
        const existing = userRoleMap.get(row.user_id);
        userRoleMap.set(row.user_id, existing ? `${existing}, ${row.role_name}` : row.role_name);
      }
    }

    const participants: Participant[] = raw.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      email: p.email,
      // Treasury users keep their treasury label; others get their actual assigned roles
      role: treasurySet.has(p.id)
        ? p.role
        : (userRoleMap.get(p.id) ?? p.role),
    }));

    return participants;
  }

  async getMessages(
    paymentRequestId: string,
    userId: string,
  ): Promise<PaymentRequestMessage[]> {
    const prRows = await this.dataSource.query<{ id: string; deleted_at: string | null }[]>(
      `SELECT id, deleted_at FROM payment_requests WHERE id = $1 LIMIT 1`,
      [paymentRequestId],
    );
    if (!prRows.length || prRows[0].deleted_at) throw new NotFoundException('Payment request not found');

    if (!(await this.canAccess(paymentRequestId, userId))) {
      throw new ForbiddenException('You are not a participant of this payment request');
    }

    return this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 's')
      .where('m.payment_request_id = :paymentRequestId', { paymentRequestId })
      .orderBy('m.created_at', 'ASC')
      .getMany();
  }

  async sendMessage(
    paymentRequestId: string,
    userId: string,
    text: string,
    attachments: MessageAttachment[] = [],
  ): Promise<PaymentRequestMessage> {
    const trimmed = text?.trim() ?? '';
    if (!trimmed && attachments.length === 0) {
      throw new ForbiddenException('Message or at least one attachment is required');
    }
    if (trimmed.length > 2000) {
      throw new ForbiddenException('Message must be at most 2000 characters');
    }

    const prRows = await this.dataSource.query<{ id: string; deleted_at: string | null }[]>(
      `SELECT id, deleted_at FROM payment_requests WHERE id = $1 LIMIT 1`,
      [paymentRequestId],
    );
    if (!prRows.length || prRows[0].deleted_at) throw new NotFoundException('Payment request not found');

    if (!(await this.canAccess(paymentRequestId, userId))) {
      throw new ForbiddenException('You are not a participant of this payment request');
    }

    const msg = this.repo.create({
      paymentRequestId,
      senderId: userId,
      message: trimmed,
      attachments,
    });
    const saved = await this.repo.save(msg);

    const full = await this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 's')
      .where('m.id = :id', { id: saved.id })
      .getOne();

    return full!;
  }

  /**
   * Returns message summary (count + latestAt) for every payment request
   * the given user can access that has at least one message.
   * Used by the dashboard and list page to show notification badges.
   */
  async getMessageSummary(
    userId: string,
  ): Promise<{ paymentRequestId: string; messageCount: number; latestAt: string | null }[]> {
    const rows = await this.dataSource.query<
      { payment_request_id: string; message_count: string; latest_at: string | null }[]
    >(
      `
      WITH accessible_prs AS (
        SELECT DISTINCT pr.id
        FROM payment_requests pr
        LEFT JOIN payment_request_approvals pra ON pra.payment_request_id = pr.id
        LEFT JOIN user_roles ur ON ur.user_id = $1
        JOIN users u ON u.id = $1
        WHERE pr.deleted_at IS NULL
          AND (
            pr.created_by = $1
            OR pra.approver_user_id = $1
            OR (pra.approver_type = 'ROLE' AND pra.approver_role_id = ur.role_id)
            OR pr.treasury_maker_by = $1
            OR pr.treasury_checker_by = $1
            OR pr.treasury_authoriser_by = $1
            OR (pr.treasury_maker_role_id IS NOT NULL AND pr.treasury_maker_role_id = ur.role_id)
            OR (pr.treasury_checker_role_id IS NOT NULL AND pr.treasury_checker_role_id = ur.role_id)
            OR (pr.treasury_authoriser_role_id IS NOT NULL AND pr.treasury_authoriser_role_id = ur.role_id)
            OR EXISTS (
              SELECT 1 FROM user_roles ur2
              JOIN roles r2 ON r2.id = ur2.role_id
              WHERE ur2.user_id = $1
                AND r2.code IN ('TREASURY_MAKER_ONLINE','TREASURY_MAKER_OFFLINE','TREASURY_CHECKER','TREASURY_AUTHORISER')
            )
            OR u.is_platform_admin = true
          )
      )
      SELECT
        ap.id AS payment_request_id,
        COUNT(m.id)::int AS message_count,
        MAX(m.created_at) AS latest_at
      FROM accessible_prs ap
      JOIN payment_request_messages m ON m.payment_request_id = ap.id
      GROUP BY ap.id
      HAVING COUNT(m.id) > 0
      `,
      [userId],
    );

    return rows.map((r) => ({
      paymentRequestId: r.payment_request_id,
      messageCount: Number(r.message_count),
      latestAt: r.latest_at,
    }));
  }
}
