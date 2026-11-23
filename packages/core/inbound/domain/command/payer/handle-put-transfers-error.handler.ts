// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionMessage } from '@shared/messaging';
import { FSPIOP_RESPONSE_PORT, FspiopResponsePort, TRANSACTION_AUDIT_PORT, TransactionAuditPort } from '../../port';
import { HandlePutTransfersErrorCommand } from './handle-put-transfers-error.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandlePutTransfersErrorCommand)
export class HandlePutTransfersErrorHandler
    implements ICommandHandler<HandlePutTransfersErrorCommand, HandlePutTransfersErrorCommand.Output>
{

    constructor(
        @Inject(TRANSACTION_AUDIT_PORT)
        private readonly auditPort: TransactionAuditPort,
        @Inject(FSPIOP_RESPONSE_PORT)
        private readonly responsePort: FspiopResponsePort,
    ) {
    }

    async execute(command: HandlePutTransfersErrorCommand): Promise<HandlePutTransfersErrorCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, transferId, error} = command.input;

        if (error == null) {
            return new HandlePutTransfersErrorCommand.Output();
        }

        const auditCorrelationId = resolveGatewayCorrelationId(correlationId, transferId);
        const createdAt = new Date();

        await this.auditPort.publish(
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

        await this.responsePort.publishTransfersError({
            payerFsp,
            transferId,
            error,
        });

        return new HandlePutTransfersErrorCommand.Output();
    }
}
