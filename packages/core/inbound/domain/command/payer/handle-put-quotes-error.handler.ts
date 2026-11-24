// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuditMessagingSubjects, FspiopMessagingSubjects, TransactionMessage } from '@shared/messaging';
import { MESSAGE_BUS_PORT, MessageBusPort } from '../../port';
import { HandlePutQuotesErrorCommand } from './handle-put-quotes-error.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePutQuotesErrorCommand)
export class HandlePutQuotesErrorHandler
    implements ICommandHandler<HandlePutQuotesErrorCommand, HandlePutQuotesErrorCommand.Output>
{

    constructor(
        @Inject(MESSAGE_BUS_PORT)
        private readonly bus: MessageBusPort,
    ) {
    }

    async execute(command: HandlePutQuotesErrorCommand): Promise<HandlePutQuotesErrorCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, quoteId, error} = command.input;

        if (error == null) {
            return new HandlePutQuotesErrorCommand.Output();
        }

        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, quoteId);
        const createdAt = new Date();

        await this.bus.publish(
            AuditMessagingSubjects.transaction,
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

        const subject = FspiopMessagingSubjects.Quotes.forError(payerFsp, quoteId);
        await this.bus.publish(subject, error);

        return new HandlePutQuotesErrorCommand.Output();
    }
}
