// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionMessage, TransferRequestMessage } from '@shared/messaging';
import { TRANSFER_REQUEST_PORT, TransferRequestPort, TRANSACTION_AUDIT_PORT, TransactionAuditPort } from '../../port';
import { HandlePostTransfersCommand } from './handle-post-transfers.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePostTransfersCommand)
export class HandlePostTransfersHandler
    implements ICommandHandler<HandlePostTransfersCommand, HandlePostTransfersCommand.Output> {

    constructor(
        @Inject(TRANSACTION_AUDIT_PORT)
        private readonly auditPort: TransactionAuditPort,
        @Inject(TRANSFER_REQUEST_PORT)
        private readonly transferPort: TransferRequestPort,
    ) {}

    async execute(command: HandlePostTransfersCommand): Promise<HandlePostTransfersCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, request} = command.input;
        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, request.transferId);
        const connectorCorrelationId = correlationId?.trim() || auditCorrelationId;
        const createdAt = new Date();

        await this.auditPort.publish(
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

        await this.transferPort.publish(
            new TransferRequestMessage(connectorCorrelationId, payerFsp, payeeFsp, request),
        );
        return new HandlePostTransfersCommand.Output();
    }
}
