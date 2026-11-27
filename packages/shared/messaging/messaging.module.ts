// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Module } from '@nestjs/common';
import {
    ConfigurableModuleClass,
    MESSAGING_OPTIONS_TOKEN,
} from './messaging.module-definition';
import { MessagingOptions, messagingOptionsSchema } from './messaging.schema';
import { MESSAGE_BUS } from './message-bus.interface';
import { RESPONSE_SUBSCRIBER } from './response-subscriber.interface';
import { NatsMessageBusService } from './providers/nats/nats-message-bus.service';
import { ResponseSubscriberService } from './providers/nats/response-subscriber.service';

@Module({
    providers: [
        {
            provide: NatsMessageBusService,
            useFactory: (options: MessagingOptions): NatsMessageBusService => {
                const validated = messagingOptionsSchema.parse(options);
                return new NatsMessageBusService(validated.url, {
                    streamName: validated.streamName,
                    timeoutMs: validated.timeoutMs,
                });
            },
            inject: [MESSAGING_OPTIONS_TOKEN],
        },
        {
            provide: MESSAGE_BUS,
            useExisting: NatsMessageBusService,
        },
        {
            provide: ResponseSubscriberService,
            useFactory: (natsBus: NatsMessageBusService): ResponseSubscriberService => {
                return new ResponseSubscriberService(natsBus);
            },
            inject: [NatsMessageBusService],
        },
        {
            provide: RESPONSE_SUBSCRIBER,
            useExisting: ResponseSubscriberService,
        },
    ],
    exports: [MESSAGE_BUS, RESPONSE_SUBSCRIBER],
})
export class MessagingModule extends ConfigurableModuleClass {}
