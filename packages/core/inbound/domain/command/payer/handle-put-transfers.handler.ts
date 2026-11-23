// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FspiopPubSubSubjects } from '@shared/fspiop';
import { AuditMessagingSubjects, TransactionMessage } from '@shared/messaging';
import { MESSAGE_BUS_PORT, MessageBusPort } from '../../port';
import { HandlePutTransfersCommand } from './handle-put-transfers.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePutTransfersCommand)
export class HandlePutTransfersHandler
    implements ICommandHandler<HandlePutTransfersCommand, HandlePutTransfersCommand.Output>
{

    constructor(
        @Inject(MESSAGE_BUS_PORT)
        private readonly bus: MessageBusPort,
    ) {
    }

    async execute(command: HandlePutTransfersCommand): Promise<HandlePutTransfersCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, transferId, response} = command.input;

        if (response == null) {
            return new HandlePutTransfersCommand.Output();
        }

        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, transferId);
        const createdAt = new Date();

        await this.bus.publish(
            AuditMessagingSubjects.transaction,
            TransactionMessage.response(
                TransactionMessage.InvocationPhase.Transfers,
                TransactionMessage.InvocationGateway.Inbound,
                {
                    correlationId: auditCorrelationId,
                    payerFsp,
                    payeeFsp,
                    response,
                    occurredAt: createdAt,
                },
            ),
        );

        const subject = FspiopPubSubSubjects.Transfers.forSuccess(payerFsp, transferId);
        await this.bus.publish(subject, response);

        return new HandlePutTransfersCommand.Output();
    }
}
