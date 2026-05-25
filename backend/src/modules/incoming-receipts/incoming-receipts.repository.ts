import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomingReceipt } from './incoming-receipt.entity';
import { IncomingReceiptDocument } from './incoming-receipt-document.entity';

@Injectable()
export class IncomingReceiptsRepository {
  constructor(
    @InjectRepository(IncomingReceipt)
    private readonly irRepo: Repository<IncomingReceipt>,
    @InjectRepository(IncomingReceiptDocument)
    private readonly docRepo: Repository<IncomingReceiptDocument>,
  ) {}

  get raw(): Repository<IncomingReceipt> {
    return this.irRepo;
  }

  create(data: Partial<IncomingReceipt>): IncomingReceipt {
    return this.irRepo.create(data);
  }

  save(entity: IncomingReceipt): Promise<IncomingReceipt> {
    return this.irRepo.save(entity);
  }

  findOneById(id: string, withRelations = false): Promise<IncomingReceipt | null> {
    return this.irRepo.findOne({
      where: { id },
      relations: withRelations
        ? {
            legalEntity: true,
            counterparty: true,
            receiveFromAccount: { bank: true, currency: true },
            documents: true,
          }
        : {},
    });
  }

  async softRemove(entity: IncomingReceipt): Promise<IncomingReceipt> {
    return this.irRepo.softRemove(entity);
  }

  saveDocuments(docs: IncomingReceiptDocument[]): Promise<IncomingReceiptDocument[]> {
    return this.docRepo.save(docs);
  }

  findDocuments(incomingReceiptId: string): Promise<IncomingReceiptDocument[]> {
    return this.docRepo.find({
      where: { incomingReceiptId },
      order: { uploadedAt: 'ASC' },
    });
  }

  /** §7.3 — Look up a user's email for the credit-received notification. */
  async findUserEmail(userId: string): Promise<string | null> {
    const rows = await this.irRepo.query(
      `SELECT email FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [userId],
    );
    if (!rows || (rows as unknown[]).length === 0) return null;
    return (rows as Array<{ email: string }>)[0].email ?? null;
  }

  async nextSequenceValue(): Promise<number> {
    const rows = await this.irRepo.query(`SELECT nextval('incoming_receipt_seq') AS n`);
    return Number((rows as Array<{ n: string }>)[0].n);
  }
}
