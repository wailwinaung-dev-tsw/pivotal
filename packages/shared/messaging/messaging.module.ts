// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Module } from '@nestjs/common';
import {
    ConfigurableModuleClass,
    MESSAGING_OPTIONS_TOKEN,
} from './messaging.module-definition';
import { MessagingOptions } from './messaging.schema';
import { MESSAGE_BUS } from './message-bus.interface';
import { NatsMessageBusService } from './providers/nats/nats-message-bus.service';

@Module({
    providers: [
        {
            provide: NatsMessageBusService,
            useFactory: (options: MessagingOptions): NatsMessageBusService => {
                return new NatsMessageBusService(options.url);
            },
            inject: [MESSAGING_OPTIONS_TOKEN],
        },
        {
            provide: MESSAGE_BUS,
            useExisting: NatsMessageBusService,
        },
    ],
    exports: [MESSAGE_BUS],
})
export class MessagingModule extends ConfigurableModuleClass {}
