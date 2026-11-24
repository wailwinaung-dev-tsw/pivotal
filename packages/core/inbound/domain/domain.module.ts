// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigurableModuleClass } from './domain.module-definition';
import {
    HandleGetPartiesHandler,
    HandlePatchTransfersHandler,
    HandlePostQuotesHandler,
    HandlePostTransfersHandler,
} from './command/payee';
import {
    HandlePutPartiesErrorHandler,
    HandlePutPartiesHandler,
    HandlePutQuotesErrorHandler,
    HandlePutQuotesHandler,
    HandlePutTransfersErrorHandler,
    HandlePutTransfersHandler,
} from './command/payer';

const CommandHandlers = [
    HandleGetPartiesHandler,
    HandlePostQuotesHandler,
    HandlePostTransfersHandler,
    HandlePatchTransfersHandler,
    HandlePutPartiesHandler,
    HandlePutPartiesErrorHandler,
    HandlePutQuotesHandler,
    HandlePutQuotesErrorHandler,
    HandlePutTransfersHandler,
    HandlePutTransfersErrorHandler,
];

@Module({
    imports: [CqrsModule],
    providers: [...CommandHandlers],
    exports: [CqrsModule, ...CommandHandlers],
})
export class InboundDomainModule extends ConfigurableModuleClass {}
