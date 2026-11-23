// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuoteRequestMessage, TransactionMessage } from '@shared/messaging';
import { QUOTE_REQUEST_PORT, QuoteRequestPort, TRANSACTION_AUDIT_PORT, TransactionAuditPort } from '../../port';
import { HandlePostQuotesCommand } from './handle-post-quotes.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePostQuotesCommand)
export class HandlePostQuotesHandler
    implements ICommandHandler<HandlePostQuotesCommand, HandlePostQuotesCommand.Output> {

    constructor(
        @Inject(TRANSACTION_AUDIT_PORT)
        private readonly auditPort: TransactionAuditPort,
        @Inject(QUOTE_REQUEST_PORT)
        private readonly quotePort: QuoteRequestPort,
    ) {}

    async execute(command: HandlePostQuotesCommand): Promise<HandlePostQuotesCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, request, iso20022PostQuoteRequest} = command.input;
        const auditCorrelationId = resolveGatewayCorrelationId(
            correlationId,
            request.transactionId,
            request.transactionRequestId,
            request.quoteId,
        );
        const connectorCorrelationId = correlationId?.trim() || auditCorrelationId;
        const createdAt = new Date();

        await this.auditPort.publish(
            TransactionMessage.request(
                TransactionMessage.InvocationPhase.Quotes,
                TransactionMessage.InvocationGateway.Inbound,
                {
                    correlationId: auditCorrelationId,
                    payerFsp,
                    payeeFsp,
                    request,
                    occurredAt: createdAt,
                },
            ),
        );

        await this.quotePort.publish(
            new QuoteRequestMessage(
                connectorCorrelationId,
                payerFsp,
                payeeFsp,
                request,
                iso20022PostQuoteRequest,
            ),
        );
        return new HandlePostQuotesCommand.Output();
    }
}
