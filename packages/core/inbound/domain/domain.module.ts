// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {DynamicModule, Module} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';
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
export class InboundDomainModule {

    /**
     * @deprecated InboundDomainModule no longer requires infrastructure settings.
     * Kept for backwards compatibility during migration.
     */
    static forRootAsync(asyncOptions?: InboundDomainModule.AsyncOptions): DynamicModule {
        return {
            module: InboundDomainModule,
            imports: [
                CqrsModule,
                ...(asyncOptions?.imports ?? []),
            ],
            providers: [...CommandHandlers],
            exports: [CqrsModule, ...CommandHandlers],
        };
    }
}

export namespace InboundDomainModule {

    export interface RequiredSettings {
    }

    export type AsyncOptions = {
        imports?: any[];
        useFactory?: (...args: any[]) => RequiredSettings | Promise<RequiredSettings>;
        inject?: any[];
    };
}
