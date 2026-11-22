// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { NatsClientService } from './nats-client.service';
import {
    ConfigurableModuleClass,
    NATS_OPTIONS_TOKEN,
} from './nats-client.module-definition';
import { NatsOptions } from './nats.schema';

const LEGACY_REQUIRED_SETTINGS = Symbol('NatsClientServiceRequiredSettings');

@Module({
    providers: [
        {
            provide: NatsClientService,
            useFactory: (options: NatsOptions): NatsClientService => {
                return new NatsClientService(options.url);
            },
            inject: [NATS_OPTIONS_TOKEN],
        },
    ],
    exports: [NatsClientService],
})
export class NatsClientServiceModule extends ConfigurableModuleClass {

    /**
     * Legacy forRootAsync for un-migrated modules.
     * New modules should use register() or registerAsync().
     */
    static forRootAsync(asyncOptions: NatsClientServiceModule.AsyncOptions): DynamicModule {
        return {
            module: NatsClientServiceModule,
            imports: asyncOptions.imports ?? [],
            providers: [
                {
                    provide: LEGACY_REQUIRED_SETTINGS,
                    useFactory: asyncOptions.useFactory,
                    inject: asyncOptions.inject ?? [],
                },
                {
                    provide: NatsClientService,
                    useFactory: (settings: NatsClientServiceModule.RequiredSettings): NatsClientService => {
                        return new NatsClientService(settings.natsUrl());
                    },
                    inject: [LEGACY_REQUIRED_SETTINGS],
                },
            ],
            exports: [NatsClientService],
        };
    }
}

export namespace NatsClientServiceModule {

    /**
     * @deprecated Kept for un-migrated modules. Use NatsOptions instead.
     */
    export interface RequiredSettings {
        natsUrl(): string;
    }

    /**
     * @deprecated Kept for un-migrated modules. Use NatsAsyncOptions instead.
     */
    export type AsyncOptions = {
        imports?: any[];
        useFactory: (...args: any[]) => RequiredSettings | Promise<RequiredSettings>;
        inject?: any[];
    };
}
