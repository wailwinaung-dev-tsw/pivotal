// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FspiopMessagingSubjects, PartyLookupMessage } from '@shared/messaging';
import { MESSAGE_BUS_PORT, MessageBusPort } from '../../port';
import { HandleGetPartiesCommand } from './handle-get-parties.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandleGetPartiesCommand)
export class HandleGetPartiesHandler
    implements ICommandHandler<HandleGetPartiesCommand, HandleGetPartiesCommand.Output> {

    constructor(
        @Inject(MESSAGE_BUS_PORT)
        private readonly bus: MessageBusPort,
    ) {}

    async execute(command: HandleGetPartiesCommand): Promise<HandleGetPartiesCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, partyIdType, partyId, subId} = command.input;
        const connectorCorrelationId = resolveGatewayCorrelationId(correlationId);

        const subject = FspiopMessagingSubjects.partyLookup(payeeFsp);
        await this.bus.publish(
            subject,
            new PartyLookupMessage(connectorCorrelationId, payerFsp, payeeFsp, partyIdType, partyId, subId),
        );
        return new HandleGetPartiesCommand.Output();
    }
}
