import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { InvoiceWebhookDto } from './dto/invoice-webhook.dto';
import { InvoiceWebhookService } from './invoice-webhook.service';

/**
 * Inbound webhook for the invoicing application.
 *
 * Currently **open** (no authentication) by design decision — the approval
 * matrix, not this endpoint, is what authorises money leaving. Requests land
 * as DRAFT unless the caller sets autoSubmit. When this is exposed beyond a
 * trusted network, add a shared-secret header check here; nothing downstream
 * needs to change.
 */
@ApiTags('Integrations — Invoicing Webhook')
@Controller('webhooks/invoices')
export class InvoiceWebhookController {
  constructor(private readonly service: InvoiceWebhookService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a payment request from an invoice',
    description:
      'All references are sent as names and resolved against the PCS masters. ' +
      'Idempotent on (externalSystem, externalInvoiceId): a redelivery returns the ' +
      'request already created. Unresolvable names return 422 with the list of ' +
      'offending fields and near matches.',
  })
  create(@Body() dto: InvoiceWebhookDto) {
    return this.service.handleInvoice(dto);
  }

}
