// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FspiopPubSubSubjects } from '@shared/fspiop';
import { AuditMessagingSubjects, TransactionMessage } from '@shared/messaging';
import { MESSAGE_BUS_PORT, MessageBusPort } from '../../port';
import { HandlePutTransfersErrorCommand } from './handle-put-transfers-error.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePutTransfersErrorCommand)
export class HandlePutTransfersErrorHandler
    implements ICommandHandler<HandlePutTransfersErrorCommand, HandlePutTransfersErrorCommand.Output>
{

    constructor(
        @Inject(MESSAGE_BUS_PORT)
        private readonly bus: MessageBusPort,
    ) {
    }

    async execute(command: HandlePutTransfersErrorCommand): Promise<HandlePutTransfersErrorCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, transferId, error} = command.input;

        if (error == null) {
            return new HandlePutTransfersErrorCommand.Output();
        }

        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, transferId);
        const createdAt = new Date();

        await this.bus.publish(
            AuditMessagingSubjects.transaction,
            TransactionMessage.error(
                TransactionMessage.InvocationPhase.Transfers,
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

        const subject = FspiopPubSubSubjects.Transfers.forError(payerFsp, transferId);
        await this.bus.publish(subject, error);

        return new HandlePutTransfersErrorCommand.Output();
    }
}
