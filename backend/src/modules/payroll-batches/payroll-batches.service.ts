import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { PayrollBatch } from './payroll-batch.entity';
import { PayrollBatchItem } from './payroll-batch-item.entity';
import { UploadBatchDto } from './dto/upload-batch.dto';
import { RejectBatchDto, CancelBatchDto } from './dto/action-batch.dto';
import { PaymentRequestsService } from '../payment-requests/payment-requests.service';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

export interface PayrollBatchQuery extends PaginationQueryDto {
  legalEntityId?: string;
  status?: string;
  periodLabel?: string;
}

/** Per-employee variance threshold before flagging (§5.3a). Configurable via PAYROLL_VARIANCE_THRESHOLD_PCT env var. */
const VARIANCE_THRESHOLD_PCT = parseFloat(process.env.PAYROLL_VARIANCE_THRESHOLD_PCT ?? '10');

@Injectable()
export class PayrollBatchesService {
  constructor(
    @InjectRepository(PayrollBatch)
    private readonly batchRepo: Repository<PayrollBatch>,

    @InjectRepository(PayrollBatchItem)
    private readonly itemRepo: Repository<PayrollBatchItem>,

    private readonly paymentRequestsService: PaymentRequestsService,
  ) {}

  // -----------------------------------------------------------------------
  // Upload
  // -----------------------------------------------------------------------

  async upload(
    file: Express.Multer.File,
    dto: UploadBatchDto,
    userId: string,
  ): Promise<PayrollBatch> {
    // Parse CSV
    let rows: Array<Record<string, string>>;
    try {
      rows = parse(file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, string>>;
    } catch (e) {
      throw new BadRequestException(
        `The file could not be read as a CSV. Please check the file is saved in CSV format and is not corrupted, then try again. (Detail: ${(e as Error).message})`,
      );
    }

    if (rows.length === 0) {
      throw new BadRequestException(
        'The CSV file has no data rows. Please add at least one employee row and re-upload.',
      );
    }

    const required = ['employee_code', 'gross_amount', 'net_amount', 'deductions', 'payslip_url'];
    const headers = Object.keys(rows[0]);
    for (const col of required) {
      if (!headers.includes(col)) {
        throw new BadRequestException(
          `The CSV is missing the required column "${col}". The file must include these columns: employee_code, gross_amount, net_amount, deductions, payslip_url.`,
        );
      }
    }

    // §5.1b — Payslip mandatory for every employee
    const missingPayslips = rows
      .filter((r) => !r['payslip_url']?.trim())
      .map((r) => r['employee_code']?.trim() || '(unknown)');
    if (missingPayslips.length > 0) {
      throw new BadRequestException(
        `Payslip URL is mandatory for every employee. The following ${missingPayslips.length} employee(s) are missing a payslip: ${missingPayslips.join(', ')}. Please provide a payslip_url for each row and re-upload.`,
      );
    }

    // Resolve employees by code within the legal entity (joining currency for mismatch check)
    const employeeCodes = rows.map((r) => r['employee_code'].trim());
    const employees = (await this.batchRepo.query(
      `SELECT e.id, e.employee_code, e.employment_end_date, c.code AS base_currency_code
         FROM employees e
         JOIN currencies c ON c.id = e.base_currency_id
        WHERE e.legal_entity_id = $1
          AND e.employee_code = ANY($2)
          AND e.deleted_at IS NULL`,
      [dto.legalEntityId, employeeCodes],
    )) as Array<{ id: string; employee_code: string; employment_end_date: string | null; base_currency_code: string }>;

    const employeeMap = new Map(employees.map((e) => [e.employee_code, e]));
    const unknownCodes = employeeCodes.filter((c) => !employeeMap.has(c));
    if (unknownCodes.length > 0) {
      throw new BadRequestException(
        `The following employee code${unknownCodes.length > 1 ? 's were' : ' was'} not found under the selected legal entity: ${unknownCodes.join(', ')}. Please make sure you have selected the correct company in the upload form and that these employees are active in the system.`,
      );
    }

    // §5.1c — Currency mismatch: each employee's base currency must match the batch currency
    const batchCurrency = dto.currencyCode.toUpperCase();
    const currencyMismatches = employees
      .filter((e) => e.base_currency_code.toUpperCase() !== batchCurrency)
      .map((e) => `${e.employee_code} (base currency: ${e.base_currency_code})`);
    if (currencyMismatches.length > 0) {
      throw new BadRequestException(
        `The following employee(s) have a base currency that does not match the batch currency "${batchCurrency}": ${currencyMismatches.join(', ')}. Payroll batches must use a single currency matching all employee base currencies.`,
      );
    }

    // Resolve active beneficiary accounts for each employee
    const employeeIds = employees.map((e) => e.id);
    const beneAccounts = (await this.batchRepo.query(
      `SELECT id, employee_id, status
         FROM beneficiary_accounts
        WHERE employee_id = ANY($1)
          AND deleted_at IS NULL`,
      [employeeIds],
    )) as Array<{ id: string; employee_id: string; status: string }>;

    const activeBeneMap = new Map<string, string>(); // employeeId → beneficiaryAccountId
    for (const ba of beneAccounts) {
      if (ba.status === 'ACTIVE') {
        activeBeneMap.set(ba.employee_id, ba.id);
      }
    }

    // Get previous batch net amounts for variance calculation
    const prevBatchRows = (await this.batchRepo.query(
      `SELECT pbi.employee_id, pbi.net_amount_minor
         FROM payroll_batch_items pbi
         JOIN payroll_batches pb ON pb.id = pbi.batch_id
        WHERE pb.legal_entity_id = $1
          AND pb.status = 'APPROVED'
          AND pb.deleted_at IS NULL
        ORDER BY pb.created_at DESC`,
      [dto.legalEntityId],
    )) as Array<{ employee_id: string; net_amount_minor: string }>;

    // Keep only the most-recent approved net per employee
    const prevNetMap = new Map<string, number>();
    for (const row of prevBatchRows) {
      if (!prevNetMap.has(row.employee_id)) {
        prevNetMap.set(row.employee_id, Number(row.net_amount_minor));
      }
    }

    // Get previous batch headcount
    const prevHeadcountRow = (await this.batchRepo.query(
      `SELECT employee_count FROM payroll_batches
        WHERE legal_entity_id = $1
          AND status = 'APPROVED'
          AND deleted_at IS NULL
        ORDER BY created_at DESC LIMIT 1`,
      [dto.legalEntityId],
    )) as Array<{ employee_count: string }>;
    const prevHeadcount = prevHeadcountRow.length > 0 ? Number(prevHeadcountRow[0].employee_count) : null;

    // Get currency minor unit for conversion
    const currencyRows = (await this.batchRepo.query(
      `SELECT minor_unit FROM currencies WHERE code = $1 LIMIT 1`,
      [dto.currencyCode.toUpperCase()],
    )) as Array<{ minor_unit: number }>;
    const minorUnit = currencyRows.length > 0 ? currencyRows[0].minor_unit : 2;
    const multiplier = Math.pow(10, minorUnit);

    // Build batch items
    const sanityWarnings: string[] = [];
    let batchVarianceFlag = false;
    let totalGrossMinor = 0;
    let totalNetMinor = 0;

    const itemDrafts: Partial<PayrollBatchItem>[] = [];

    for (const row of rows) {
      const emp = employeeMap.get(row['employee_code'].trim())!;
      const grossAmountMinor = Math.round(parseFloat(row['gross_amount']) * multiplier);
      const netAmountMinor = Math.round(parseFloat(row['net_amount']) * multiplier);
      const deductionsMinor = Math.round(parseFloat(row['deductions'] ?? '0') * multiplier);

      if (isNaN(grossAmountMinor) || isNaN(netAmountMinor)) {
        throw new BadRequestException(
          `Row for employee "${row['employee_code']}" has an invalid amount. Please make sure gross_amount, net_amount, and deductions are valid numbers (e.g. 10000.00).`,
        );
      }

      // Variance check
      let varianceFlag = false;
      let variancePct: number | null = null;
      const previousNetMinor = prevNetMap.get(emp.id) ?? null;
      if (previousNetMinor !== null && previousNetMinor > 0) {
        variancePct = ((netAmountMinor - previousNetMinor) / previousNetMinor) * 100;
        if (Math.abs(variancePct) > VARIANCE_THRESHOLD_PCT) {
          varianceFlag = true;
          batchVarianceFlag = true;
          sanityWarnings.push(
            `${row['employee_code']}: net pay variance ${variancePct.toFixed(1)}% (previous ${previousNetMinor}, current ${netAmountMinor})`,
          );
        }
      }

      totalGrossMinor += grossAmountMinor;
      totalNetMinor += netAmountMinor;

      itemDrafts.push({
        employeeId: emp.id,
        beneficiaryAccountId: activeBeneMap.get(emp.id) ?? null,
        grossAmountMinor,
        netAmountMinor,
        deductionsMinor,
        payslipUrl: row['payslip_url'] ?? null,
        varianceFlag,
        previousNetMinor,
        variancePct: variancePct !== null ? parseFloat(variancePct.toFixed(2)) : null,
      });
    }

    const headcountDelta = prevHeadcount !== null ? rows.length - prevHeadcount : null;
    if (headcountDelta !== null && Math.abs(headcountDelta) > 0) {
      sanityWarnings.push(`Headcount changed by ${headcountDelta > 0 ? '+' : ''}${headcountDelta} vs previous approved batch`);
    }

    // §5.3b — Per-batch net variance vs previous approved batch totals
    const prevBatchTotalsRow = (await this.batchRepo.query(
      `SELECT total_net_minor FROM payroll_batches
        WHERE legal_entity_id = $1
          AND status = 'APPROVED'
          AND deleted_at IS NULL
        ORDER BY created_at DESC LIMIT 1`,
      [dto.legalEntityId],
    )) as Array<{ total_net_minor: string }>;
    if (prevBatchTotalsRow.length > 0) {
      const prevTotalNet = Number(prevBatchTotalsRow[0].total_net_minor);
      if (prevTotalNet > 0) {
        const batchVariancePct = ((totalNetMinor - prevTotalNet) / prevTotalNet) * 100;
        if (Math.abs(batchVariancePct) > VARIANCE_THRESHOLD_PCT) {
          batchVarianceFlag = true;
          sanityWarnings.push(
            `Batch total net pay variance ${batchVariancePct.toFixed(1)}% vs previous approved batch (previous: ${prevTotalNet}, current: ${totalNetMinor})`,
          );
        }
      }
    }

    // Generate batch number
    const seq = await this.batchRepo.query(
      `SELECT nextval('payroll_batch_seq') AS val`,
    ) as Array<{ val: string }>;
    const batchNumber = `PRL-${new Date().getFullYear()}-${String(seq[0].val).padStart(5, '0')}`;

    // Save batch
    const batch = this.batchRepo.create({
      batchNumber,
      legalEntityId: dto.legalEntityId,
      periodLabel: dto.periodLabel,
      currencyCode: dto.currencyCode.toUpperCase(),
      totalGrossMinor,
      totalNetMinor,
      employeeCount: rows.length,
      varianceFlag: batchVarianceFlag,
      headcountDelta,
      sanityNotes: sanityWarnings.length > 0 ? sanityWarnings.join('\n') : null,
      status: 'DRAFT',
      fileUrl: `/uploads/${file.filename ?? file.originalname}`,
      uploadedBy: userId,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedBatch = await this.batchRepo.save(batch);

    // Save items
    const items = itemDrafts.map((d) =>
      this.itemRepo.create({ ...d, batchId: savedBatch.id }),
    );
    await this.itemRepo.save(items);

    return this.findOne(savedBatch.id);
  }

  // -----------------------------------------------------------------------
  // Read
  // -----------------------------------------------------------------------

  async findAll(query: PayrollBatchQuery): Promise<PaginatedResult<PayrollBatch>> {
    const { page = 1, limit = 20, legalEntityId, status, periodLabel } = query;

    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (legalEntityId) where['legalEntityId'] = legalEntityId;
    if (status) where['status'] = status;
    if (periodLabel) where['periodLabel'] = ILike(`%${periodLabel}%`);

    const [data, total] = await this.batchRepo.findAndCount({
      where,
      relations: { legalEntity: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<PayrollBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { legalEntity: true },
    });
    if (!batch) throw new NotFoundException('Payroll batch not found. It may have been deleted or the link is invalid.');
    return batch;
  }

  async findOneWithItems(id: string): Promise<PayrollBatch & { items: PayrollBatchItem[] }> {
    const batch = await this.findOne(id);
    const items = await this.itemRepo.find({
      where: { batchId: id },
      relations: { employee: true, beneficiaryAccount: { bank: true, currency: true } },
      order: { createdAt: 'ASC' },
    });
    return Object.assign(batch, { items });
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  async submit(id: string, userId: string): Promise<PayrollBatch> {
    const batch = await this.findOne(id);
    if (batch.status !== 'DRAFT') {
      const label = batch.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This batch is currently "${label}" and cannot be submitted. Only a Draft batch can be submitted for approval.`,
      );
    }

    const items = await this.itemRepo.find({
      where: { batchId: id },
      relations: { employee: true },
    });

    // Create individual payment requests for each item
    for (const item of items) {
      const grossMajor = (item.grossAmountMinor / 100).toFixed(2);
      const pr = await this.paymentRequestsService.create(
        {
          paymentTypeCode: 'PAYROLL',
          legalEntityId: batch.legalEntityId,
          employeeId: item.employeeId,
          beneficiaryAccountId: item.beneficiaryAccountId ?? undefined,
          currencyCode: batch.currencyCode,
          amount: grossMajor,
          amountMinor: item.grossAmountMinor,
          purposeDescription: `Payroll batch ${batch.batchNumber} — ${batch.periodLabel}`,
        },
        userId,
      );
      item.paymentRequestId = pr.id;
      await this.itemRepo.save(item);
    }

    batch.status = 'PENDING_APPROVAL';
    batch.submittedAt = new Date();
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  async approve(id: string, userId: string): Promise<PayrollBatch> {
    const batch = await this.findOne(id);
    if (batch.status !== 'PENDING_APPROVAL') {
      const label = batch.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This batch is currently "${label}" and cannot be approved. Only a batch in "Pending Approval" status can be approved.`,
      );
    }

    const items = await this.itemRepo.find({ where: { batchId: id } });

    // Submit each underlying payment request
    for (const item of items) {
      if (item.paymentRequestId) {
        try {
          await this.paymentRequestsService.submit(item.paymentRequestId, userId);
        } catch {
          // Individual PR validation errors do not abort the whole batch approval
        }
      }
    }

    batch.status = 'APPROVED';
    batch.approvedBy = userId;
    batch.approvedAt = new Date();
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  async reject(id: string, userId: string, dto: RejectBatchDto): Promise<PayrollBatch> {
    const batch = await this.findOne(id);
    if (batch.status !== 'PENDING_APPROVAL') {
      const label = batch.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This batch is currently "${label}" and cannot be rejected. Only a batch in "Pending Approval" status can be rejected.`,
      );
    }
    batch.status = 'REJECTED';
    batch.rejectedBy = userId;
    batch.rejectedAt = new Date();
    batch.rejectionReason = dto.reason;
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  async cancel(id: string, userId: string, dto: CancelBatchDto): Promise<PayrollBatch> {
    const batch = await this.findOne(id);
    const terminal: string[] = ['APPROVED', 'REJECTED', 'CANCELLED'];
    if (terminal.includes(batch.status)) {
      const label = batch.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This batch has already been "${label}" and cannot be cancelled.`,
      );
    }
    batch.status = 'CANCELLED';
    batch.rejectionReason = dto.reason ?? null;
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }
}
