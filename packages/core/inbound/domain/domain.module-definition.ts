// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { ConfigurableModuleBuilder, Provider, Type } from '@nestjs/common';
import { MESSAGE_BUS_PORT, MessageBusPort } from './port';

export type PortBinding<T> =
    | { useClass: Type<T> }
    | { useValue: T }
    | { useFactory: (...args: any[]) => T | Promise<T>; inject?: any[] }
    | { useExisting: any };

export interface InboundDomainExtras {
    imports?: any[];
    messageBus?: PortBinding<MessageBusPort>;
    providers?: Provider[];
}

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN: INBOUND_DOMAIN_OPTIONS_TOKEN,
    OPTIONS_TYPE: INBOUND_DOMAIN_OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE: INBOUND_DOMAIN_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<{}>({ moduleName: 'InboundDomain' })
    .setExtras<InboundDomainExtras>(
        { imports: [], providers: [] },
        (definition, extras) => {
            const extraProviders: Provider[] = [...(extras.providers ?? [])];
            if (extras.messageBus) {
                extraProviders.push({
                    provide: MESSAGE_BUS_PORT,
                    ...extras.messageBus,
                });
            }
            return {
                ...definition,
                imports: [...(definition.imports ?? []), ...(extras.imports ?? [])],
                providers: [...(definition.providers ?? []), ...extraProviders],
            };
        },
    )
    .build();
