// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PartyLookupMessage } from '@shared/messaging';
import { PARTY_LOOKUP_PORT, PartyLookupPort } from '../../port';
import { HandleGetPartiesCommand } from './handle-get-parties.command';
import { resolveGatewayCorrelationId } from '../gateway-audit';

@CommandHandler(HandleGetPartiesCommand)
export class HandleGetPartiesHandler
    implements ICommandHandler<HandleGetPartiesCommand, HandleGetPartiesCommand.Output> {

    constructor(
        @Inject(PARTY_LOOKUP_PORT)
        private readonly port: PartyLookupPort,
    ) {}

    async execute(command: HandleGetPartiesCommand): Promise<HandleGetPartiesCommand.Output> {
        const {correlationId, payerFsp, payeeFsp, partyIdType, partyId, subId} = command.input;
        const connectorCorrelationId = resolveGatewayCorrelationId(correlationId);

        await this.port.publish(
            new PartyLookupMessage(connectorCorrelationId, payerFsp, payeeFsp, partyIdType, partyId, subId),
        );
        return new HandleGetPartiesCommand.Output();
    }
}
