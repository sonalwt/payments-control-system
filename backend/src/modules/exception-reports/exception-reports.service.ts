import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExceptionReport } from './exception-report.entity';
import { ExceptionReportItem } from './exception-report-item.entity';
import { EmailService } from '../../notifications/email.service';

interface PrRow {
  id: string;
  requestNumber: string;
  legalEntityName: string | null;
  currencyCode: string;
  amount: string;
  paidAt: Date;
}

@Injectable()
export class ExceptionReportsService {
  private readonly logger = new Logger(ExceptionReportsService.name);

  constructor(
    @InjectRepository(ExceptionReport)
    private readonly reportRepo: Repository<ExceptionReport>,

    @InjectRepository(ExceptionReportItem)
    private readonly itemRepo: Repository<ExceptionReportItem>,

    private readonly emailService: EmailService,
  ) {}

  // -----------------------------------------------------------------------
  // Cron: runs every day at 23:55 server time.
  // -----------------------------------------------------------------------
  @Cron('55 23 * * *', { name: 'daily-proof-exception-report' })
  async runDailyJob(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    this.logger.log(`Running daily proof-of-payment exception report for ${today}`);
    try {
      const report = await this.generateForDate(today);
      this.logger.log(
        `Exception report for ${today}: ${report.totalMissing} request(s) missing proof.`,
      );
      if (report.totalMissing > 0) {
        await this.notifyFinanceHeads(report);
      }
    } catch (err) {
      this.logger.error('Exception report job failed', err);
    }
  }

  // -----------------------------------------------------------------------
  // Generate (or regenerate) the report for a given date string (YYYY-MM-DD).
  // Called by the cron job and can also be called manually from the controller.
  // -----------------------------------------------------------------------
  async generateForDate(dateStr: string): Promise<ExceptionReport> {
    // Remove any existing report for this date before regenerating.
    await this.reportRepo.delete({ reportDate: dateStr });

    // Find all PAID requests from that calendar day still missing proof.
    const rows: PrRow[] = await this.reportRepo.manager.query(
      `SELECT
         pr.id,
         pr.request_number              AS "requestNumber",
         le.name                        AS "legalEntityName",
         pr.currency_code               AS "currencyCode",
         pr.amount,
         pr.paid_at                     AS "paidAt"
       FROM payment_requests pr
       LEFT JOIN legal_entities le ON le.id = pr.legal_entity_id
       WHERE pr.status = 'PAID'
         AND pr.proof_of_payment_url IS NULL
         AND pr.paid_at::date = $1::date
         AND pr.deleted_at IS NULL
       ORDER BY pr.paid_at`,
      [dateStr],
    );

    const report = this.reportRepo.create({
      reportDate: dateStr,
      totalMissing: rows.length,
      generatedAt: new Date(),
      items: rows.map((r) =>
        this.itemRepo.create({
          paymentRequestId: r.id,
          requestNumber: r.requestNumber,
          legalEntityName: r.legalEntityName,
          currencyCode: r.currencyCode,
          amount: r.amount,
          paidAt: r.paidAt,
        }),
      ),
    });

    return this.reportRepo.save(report);
  }

  // -----------------------------------------------------------------------
  // List reports, most recent first (paginated).
  // -----------------------------------------------------------------------
  async findAll(page: number, limit: number): Promise<{ data: ExceptionReport[]; total: number }> {
    const [data, total] = await this.reportRepo.findAndCount({
      order: { reportDate: 'DESC' },
      relations: ['items'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // -----------------------------------------------------------------------
  // Single report with items.
  // -----------------------------------------------------------------------
  async findOne(id: string): Promise<ExceptionReport | null> {
    return this.reportRepo.findOne({ where: { id }, relations: ['items'] });
  }

  // -----------------------------------------------------------------------
  // Send daily exception report email to all active FINANCE_HEAD users.
  // -----------------------------------------------------------------------
  private async notifyFinanceHeads(report: ExceptionReport): Promise<void> {
    // Find all active users who hold the FINANCE_HEAD role in any entity.
    const rows: Array<{ email: string; full_name: string }> =
      await this.reportRepo.manager.query(
        `SELECT DISTINCT u.email, u.full_name
         FROM users u
         JOIN user_entity_roles uer ON uer.user_id = u.id AND uer.is_active = true
         JOIN roles r ON r.id = uer.role_id AND r.code = 'FINANCE_HEAD'
         WHERE u.is_active = true
           AND u.deleted_at IS NULL`,
      );

    if (rows.length === 0) {
      this.logger.warn('No active FINANCE_HEAD users found — skipping exception report email');
      return;
    }

    const recipientEmails = rows.map((r) => r.email);

    const itemRows =
      report.items && report.items.length > 0
        ? report.items
            .map(
              (item) =>
                `<tr>
                  <td style="padding:6px 12px;border-bottom:1px solid #eee">${item.requestNumber}</td>
                  <td style="padding:6px 12px;border-bottom:1px solid #eee">${item.legalEntityName ?? '—'}</td>
                  <td style="padding:6px 12px;border-bottom:1px solid #eee">${item.currencyCode} ${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="padding:6px 12px;border-bottom:1px solid #eee">${new Date(item.paidAt).toISOString().slice(0, 10)}</td>
                </tr>`,
            )
            .join('')
        : '<tr><td colspan="4" style="padding:6px 12px">No items</td></tr>';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto">
        <h2 style="color:#dc2626">Proof-of-Payment Exception Report — ${report.reportDate}</h2>
        <p>The following <strong>${report.totalMissing}</strong> payment request(s) were marked <strong>PAID</strong> on ${report.reportDate} but have no proof-of-payment document attached.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px 12px;text-align:left">Request #</th>
              <th style="padding:8px 12px;text-align:left">Legal Entity</th>
              <th style="padding:8px 12px;text-align:left">Amount</th>
              <th style="padding:8px 12px;text-align:left">Paid Date</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">
          This is an automated message from the Payments Control System. Please log in to upload the missing proof-of-payment documents.
        </p>
      </div>`;

    const text = `Proof-of-Payment Exception Report — ${report.reportDate}\n\n${report.totalMissing} payment request(s) are missing proof-of-payment documents.\n\nRequest Numbers:\n${(report.items ?? []).map((i) => `- ${i.requestNumber}`).join('\n')}`;

    await this.emailService.sendMail({
      to: recipientEmails,
      subject: `[PCS] ${report.totalMissing} Payment(s) Missing Proof-of-Payment — ${report.reportDate}`,
      html,
      text,
    });
  }
}
