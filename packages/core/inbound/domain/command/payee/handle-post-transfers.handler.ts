// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
    AuditMessagingSubjects,
    FspiopMessagingSubjects,
    TransactionMessage,
    TransferRequestMessage,
} from '@shared/messaging';
import { MESSAGE_BUS_PORT, MessageBusPort } from '../../port';
import { HandlePostTransfersCommand } from './handle-post-transfers.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePostTransfersCommand)
export class HandlePostTransfersHandler
    implements ICommandHandler<HandlePostTransfersCommand, HandlePostTransfersCommand.Output> {

    constructor(
        @Inject(MESSAGE_BUS_PORT)
        private readonly bus: MessageBusPort,
    ) {}

    async execute(command: HandlePostTransfersCommand): Promise<HandlePostTransfersCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, request} = command.input;
        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, request.transferId);
        const connectorCorrelationId = correlationId?.trim() || auditCorrelationId;
        const createdAt = new Date();

        await this.bus.publish(
            AuditMessagingSubjects.transaction,
            TransactionMessage.request(
                TransactionMessage.InvocationPhase.Transfers,
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

        await this.bus.publish(
            FspiopMessagingSubjects.postTransfers(payeeFsp),
            new TransferRequestMessage(connectorCorrelationId, payerFsp, payeeFsp, request),
        );
        return new HandlePostTransfersCommand.Output();
    }
}
