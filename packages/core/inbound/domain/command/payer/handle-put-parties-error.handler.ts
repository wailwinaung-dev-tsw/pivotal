// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FSPIOP_RESPONSE_PORT, FspiopResponsePort } from '../../port';
import { HandlePutPartiesErrorCommand } from './handle-put-parties-error.command';

@CommandHandler(HandlePutPartiesErrorCommand)
export class HandlePutPartiesErrorHandler
    implements ICommandHandler<HandlePutPartiesErrorCommand, HandlePutPartiesErrorCommand.Output> {

    constructor(
        @Inject(FSPIOP_RESPONSE_PORT)
        private readonly responsePort: FspiopResponsePort,
    ) {
    }

    async execute(command: HandlePutPartiesErrorCommand): Promise<HandlePutPartiesErrorCommand.Output> {
        const {payerFsp, payeeFsp, partyIdType, partyId, subId, error} = command.input;

        if (error == null) {
            return new HandlePutPartiesErrorCommand.Output();
        }

        await this.responsePort.publishPartiesError({
            payerFsp,
            payeeFsp,
            partyIdType,
            partyId,
            subId,
            error,
        });

        return new HandlePutPartiesErrorCommand.Output();
    }
}
