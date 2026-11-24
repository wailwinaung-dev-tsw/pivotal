// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
    AuditMessagingSubjects,
    FspiopMessagingSubjects,
    TransactionMessage,
    TransferPatchMessage,
} from '@shared/messaging';
import { MESSAGE_BUS_PORT, MessageBusPort } from '../../port';
import { HandlePatchTransfersCommand } from './handle-patch-transfers.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePatchTransfersCommand)
export class HandlePatchTransfersHandler
    implements ICommandHandler<HandlePatchTransfersCommand, HandlePatchTransfersCommand.Output> {

    constructor(
        @Inject(MESSAGE_BUS_PORT)
        private readonly bus: MessageBusPort,
    ) {}

    async execute(command: HandlePatchTransfersCommand): Promise<HandlePatchTransfersCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, transferId, response} = command.input;
        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, transferId);
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
                    request: response,
                    occurredAt: createdAt,
                },
            ),
        );

        await this.bus.publish(
            FspiopMessagingSubjects.patchTransfers(payeeFsp),
            new TransferPatchMessage(auditCorrelationId, payerFsp, payeeFsp, transferId, response),
        );
        return new HandlePatchTransfersCommand.Output();
    }
}
