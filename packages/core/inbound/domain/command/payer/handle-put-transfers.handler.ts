// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionMessage } from '@shared/messaging';
import { FSPIOP_RESPONSE_PORT, FspiopResponsePort, TRANSACTION_AUDIT_PORT, TransactionAuditPort } from '../../port';
import { HandlePutTransfersCommand } from './handle-put-transfers.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePutTransfersCommand)
export class HandlePutTransfersHandler
    implements ICommandHandler<HandlePutTransfersCommand, HandlePutTransfersCommand.Output>
{

    constructor(
        @Inject(TRANSACTION_AUDIT_PORT)
        private readonly auditPort: TransactionAuditPort,
        @Inject(FSPIOP_RESPONSE_PORT)
        private readonly responsePort: FspiopResponsePort,
    ) {
    }

    async execute(command: HandlePutTransfersCommand): Promise<HandlePutTransfersCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, transferId, response} = command.input;

        if (response == null) {
            return new HandlePutTransfersCommand.Output();
        }

        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, transferId);
        const createdAt = new Date();

        await this.auditPort.publish(
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

        await this.responsePort.publishTransfersSuccess({
            payerFsp,
            transferId,
            response,
        });

        return new HandlePutTransfersCommand.Output();
    }
}
