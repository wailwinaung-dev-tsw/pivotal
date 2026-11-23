// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionMessage, TransferPatchMessage } from '@shared/messaging';
import { TRANSFER_PATCH_PORT, TransferPatchPort, TRANSACTION_AUDIT_PORT, TransactionAuditPort } from '../../port';
import { HandlePatchTransfersCommand } from './handle-patch-transfers.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePatchTransfersCommand)
export class HandlePatchTransfersHandler
    implements ICommandHandler<HandlePatchTransfersCommand, HandlePatchTransfersCommand.Output> {

    constructor(
        @Inject(TRANSACTION_AUDIT_PORT)
        private readonly auditPort: TransactionAuditPort,
        @Inject(TRANSFER_PATCH_PORT)
        private readonly patchPort: TransferPatchPort,
    ) {}

    async execute(command: HandlePatchTransfersCommand): Promise<HandlePatchTransfersCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, transferId, response} = command.input;
        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, transferId);
        const createdAt = new Date();

        await this.auditPort.publish(
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

        await this.patchPort.publish(
            new TransferPatchMessage(auditCorrelationId, payerFsp, payeeFsp, transferId, response),
        );
        return new HandlePatchTransfersCommand.Output();
    }
}
