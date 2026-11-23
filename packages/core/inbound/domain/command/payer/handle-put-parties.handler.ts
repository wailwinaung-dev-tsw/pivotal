// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FspiopPubSubSubjects } from '@shared/fspiop';
import { MESSAGE_BUS_PORT, MessageBusPort } from '../../port';
import { HandlePutPartiesCommand } from './handle-put-parties.command';

@CommandHandler(HandlePutPartiesCommand)
export class HandlePutPartiesHandler
    implements ICommandHandler<HandlePutPartiesCommand, HandlePutPartiesCommand.Output> {

    constructor(
        @Inject(MESSAGE_BUS_PORT)
        private readonly bus: MessageBusPort,
    ) {
    }

    async execute(command: HandlePutPartiesCommand): Promise<HandlePutPartiesCommand.Output> {
        const {payerFsp, payeeFsp, partyIdType, partyId, subId, response} = command.input;

        if (response == null) {
            return new HandlePutPartiesCommand.Output();
        }

        const subject = FspiopPubSubSubjects.Parties.forSuccess(
            payerFsp,
            payeeFsp,
            partyIdType,
            partyId,
            subId ?? undefined,
        );

        await this.bus.publish(subject, response);

        return new HandlePutPartiesCommand.Output();
    }
}
