import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';

/**
 * Best-effort fields read off an uploaded document. This is a *temporary*,
 * zero-cost, fully-local reader: it only extracts the embedded text layer of
 * digital PDFs (via pdf-parse) and applies heuristics. It never calls an
 * external service, so document content never leaves the server.
 *
 * Scanned/photographed documents have no text layer, so `readable` is false and
 * the caller should fall back to manual entry. Results are advisory only and
 * are meant to be shown as warnings, never to block.
 */
export interface ExtractedInvoice {
  readable: boolean;
  reason?: string;
  invoiceNumber: string | null;
  amount: string | null;
}

/** Fields read off a bank remittance / SWIFT / MT103 copy. */
export interface ExtractedRemittance {
  readable: boolean;
  reason?: string;
  referenceNumber: string | null;
  amount: string | null;
}

const INVOICE_AMOUNT_LABELS = [
  'grand\\s+total',
  'total\\s+amount\\s+due',
  'amount\\s+due',
  'balance\\s+due',
  'total\\s+due',
  'total\\s+amount',
  'total\\s+payable',
  'total',
];

// Bank-advice / SWIFT wording. "amount" is last so a more specific label wins.
const REMITTANCE_AMOUNT_LABELS = [
  'settlement\\s+amount',
  'transfer\\s+amount',
  'remittance\\s+amount',
  'transaction\\s+amount',
  'payment\\s+amount',
  'total\\s+amount',
  'amount\\s+remitted',
  'amount\\s+paid',
  'amount',
];

@Injectable()
export class DocumentExtractionService {
  private readonly logger = new Logger(DocumentExtractionService.name);

  async extractInvoice(buffer: Buffer, mimeType: string): Promise<ExtractedInvoice> {
    const read = await this.readPdfText(buffer, mimeType);
    if (!read.text) {
      return { readable: false, reason: read.reason, invoiceNumber: null, amount: null };
    }
    return {
      readable: true,
      invoiceNumber: this.findInvoiceNumber(read.text),
      amount: this.findAmount(read.text, INVOICE_AMOUNT_LABELS),
    };
  }

  async extractRemittance(buffer: Buffer, mimeType: string): Promise<ExtractedRemittance> {
    const read = await this.readPdfText(buffer, mimeType);
    if (!read.text) {
      return { readable: false, reason: read.reason, referenceNumber: null, amount: null };
    }
    return {
      readable: true,
      referenceNumber: this.findReference(read.text),
      amount: this.findRemittanceAmount(read.text),
    };
  }

  /**
   * Extract the embedded text layer of a digital PDF. Returns `text: null` with
   * a human-readable reason for non-PDFs, parse failures, or scanned/image PDFs
   * (which carry no text layer and would need OCR).
   */
  private async readPdfText(
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ text: string | null; reason?: string }> {
    if (mimeType !== 'application/pdf') {
      return {
        text: null,
        reason: 'Auto-read only supports PDF files. Please verify the details manually.',
      };
    }
    let text: string;
    try {
      const parsed = await pdfParse(buffer);
      text = parsed.text ?? '';
    } catch (err) {
      this.logger.warn(
        `pdf-parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { text: null, reason: 'Could not read this PDF. Please verify the details manually.' };
    }
    if (text.replace(/\s+/g, '').length < 20) {
      return {
        text: null,
        reason:
          'This looks like a scanned image with no readable text. Please verify the details manually.',
      };
    }
    return { text };
  }

  /**
   * Heuristic: the token following an "Invoice No / # / Number" label. The
   * captured token must contain at least one digit (the `(?=...\d...)`
   * lookahead) — invoice numbers virtually always do, and this stops a bare
   * "Invoice" word in a title/heading from being mistaken for the number.
   */
  private findInvoiceNumber(text: string): string | null {
    const m = text.match(
      /invoice\s*(?:no\.?|number|num\.?|#)?\s*[:#]?\s*((?=[A-Za-z0-9\-_/]*\d)[A-Za-z0-9][A-Za-z0-9\-_/]{2,})/i,
    );
    return m ? m[1].trim() : null;
  }

  /**
   * Heuristic for a bank reference: MT103 field 20 first, then a labelled
   * "… reference …" token (digit-bearing, to avoid grabbing a stray word),
   * then a UETR. Returns null when nothing confident is found.
   */
  private findReference(text: string): string | null {
    const mt = text.match(/:20:\s*([A-Za-z0-9\-_/]{4,})/);
    if (mt) return mt[1].trim();
    const labelled = text.match(
      /(?:transaction|payment|bank|our|your|sender'?s|beneficiary)?\s*reference\s*(?:number|no\.?|id|#)?\s*[:#]?\s*((?=[A-Za-z0-9\-_/]*\d)[A-Za-z0-9][A-Za-z0-9\-_/]{3,})/i,
    );
    if (labelled) return labelled[1].trim();
    const uetr = text.match(
      /\buetr\b\s*[:#]?\s*([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i,
    );
    if (uetr) return uetr[1].trim();
    return null;
  }

  /** Remittance amount: MT103 field 32A first, then labelled bank wording. */
  private findRemittanceAmount(text: string): string | null {
    // :32A:YYMMDD<CCC><amount> — amount uses a comma decimal separator.
    const f32 = text.match(/:32A:\s*\d{6}[A-Z]{3}\s*([\d.,]+)/i);
    if (f32) {
      const n = this.normaliseAmount(f32[1]);
      if (n) return n;
    }
    return this.findAmount(text, REMITTANCE_AMOUNT_LABELS);
  }

  /**
   * Heuristic: the amount next to the strongest label we can find. Labels are
   * tried most-specific first. `\b` around the label stops "total" matching
   * inside "Subtotal"; the `[^\d\n]{0,12}` gap lets a currency code/symbol or
   * "(USD)" sit between the label and the number.
   */
  private findAmount(text: string, labels: string[]): string | null {
    for (const label of labels) {
      const re = new RegExp(`\\b${label}\\b[^\\d\\n]{0,12}(\\d[\\d.,]*\\d|\\d)`, 'i');
      const m = text.match(re);
      if (m) {
        const normalised = this.normaliseAmount(m[1]);
        if (normalised) return normalised;
      }
    }
    return null;
  }

  /**
   * Normalise a captured amount to a plain decimal string, handling both the
   * "1,234.56" (comma thousands / dot decimal) and "1.234,56" / "1234,56"
   * (European / SWIFT comma decimal) conventions. When both separators appear,
   * the rightmost one is the decimal point. Returns null for a non-positive or
   * unparseable value.
   */
  private normaliseAmount(raw: string): string | null {
    let s = raw.replace(/[^\d.,]/g, '');
    if (!s) return null;
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    let decSep: ',' | '.' | null = null;
    if (lastComma > -1 && lastDot > -1) {
      decSep = lastComma > lastDot ? ',' : '.';
    } else if (lastComma > -1) {
      const after = s.length - 1 - lastComma;
      const count = (s.match(/,/g) || []).length;
      decSep = count === 1 && after === 2 ? ',' : null;
    } else if (lastDot > -1) {
      const after = s.length - 1 - lastDot;
      const count = (s.match(/\./g) || []).length;
      decSep = count === 1 && after !== 3 ? '.' : count > 1 ? '.' : null;
    }
    if (decSep === ',') {
      s = s.replace(/\./g, '').replace(/,/g, '.');
    } else if (decSep === '.') {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(/[.,]/g, '');
    }
    const value = Number(s);
    if (!Number.isFinite(value) || value <= 0) return null;
    return String(value);
  }
}
