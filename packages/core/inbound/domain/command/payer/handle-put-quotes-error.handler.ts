// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionMessage } from '@shared/messaging';
import { FSPIOP_RESPONSE_PORT, FspiopResponsePort, TRANSACTION_AUDIT_PORT, TransactionAuditPort } from '../../port';
import { HandlePutQuotesErrorCommand } from './handle-put-quotes-error.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePutQuotesErrorCommand)
export class HandlePutQuotesErrorHandler
    implements ICommandHandler<HandlePutQuotesErrorCommand, HandlePutQuotesErrorCommand.Output>
{

    constructor(
        @Inject(TRANSACTION_AUDIT_PORT)
        private readonly auditPort: TransactionAuditPort,
        @Inject(FSPIOP_RESPONSE_PORT)
        private readonly responsePort: FspiopResponsePort,
    ) {
    }

    async execute(command: HandlePutQuotesErrorCommand): Promise<HandlePutQuotesErrorCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, quoteId, error} = command.input;

        if (error == null) {
            return new HandlePutQuotesErrorCommand.Output();
        }

        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, quoteId);
        const createdAt = new Date();

        await this.auditPort.publish(
            TransactionMessage.error(
                TransactionMessage.InvocationPhase.Quotes,
                TransactionMessage.InvocationGateway.Inbound,
                {
                    correlationId: auditCorrelationId,
                    payerFsp,
                    payeeFsp,
                    error,
                    occurredAt: createdAt,
                },
            ),
        );

        await this.responsePort.publishQuotesError({
            payerFsp,
            quoteId,
            error,
        });

        return new HandlePutQuotesErrorCommand.Output();
    }
}
