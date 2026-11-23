// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FSPIOP_RESPONSE_PORT, FspiopResponsePort } from '../../port';
import { HandlePutPartiesCommand } from './handle-put-parties.command';

@CommandHandler(HandlePutPartiesCommand)
export class HandlePutPartiesHandler
    implements ICommandHandler<HandlePutPartiesCommand, HandlePutPartiesCommand.Output> {

    constructor(
        @Inject(FSPIOP_RESPONSE_PORT)
        private readonly responsePort: FspiopResponsePort,
    ) {
    }

    async execute(command: HandlePutPartiesCommand): Promise<HandlePutPartiesCommand.Output> {
        const {payerFsp, payeeFsp, partyIdType, partyId, subId, response} = command.input;

        if (response == null) {
            return new HandlePutPartiesCommand.Output();
        }

        await this.responsePort.publishPartiesSuccess({
            payerFsp,
            payeeFsp,
            partyIdType,
            partyId,
            subId,
            response,
        });

        return new HandlePutPartiesCommand.Output();
    }
}
