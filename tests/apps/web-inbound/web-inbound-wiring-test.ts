// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { WebInboundModule } from '../../../packages/apps/web-inbound/web-inbound.module';
import { MESSAGE_BUS, IMessageBus } from '../../../packages/shared/messaging';
import { MESSAGE_BUS_PORT, MessageBusPort, HandleGetPartiesHandler } from '../../../packages/core/inbound/domain';
import { FspiopSettings } from '../../../packages/shared/fspiop/component/fspiop-settings';
import { ApiType } from '../../../packages/shared/iso20022/api-type';
import { Iso20022Transformer } from '../../../packages/shared/iso20022/iso20022-transformer';
import { PartiesController } from '../../../packages/apps/web-inbound/controllers';

describe('WebInboundModule Wiring (Clean Architecture)', () => {
    it('successfully wires MessagingModule MESSAGE_BUS to InboundDomainModule MESSAGE_BUS_PORT', async () => {
        const published: Array<{ subject: string; message: unknown }> = [];
        const mockMessageBus: IMessageBus = {
            publish: async (subject: string, message: unknown): Promise<void> => {
                published.push({ subject, message });
            },
            subscribe: async (): Promise<any> => ({
                unsubscribe: async (): Promise<void> => {},
            }),
        };

        const definition = WebInboundModule.forRootAsync({
            useFactory: () => ({
                natsUrl: () => 'nats://localhost:4222',
                fspiopSettings: () => new FspiopSettings('hub', '', '', '', false, false, ApiType.FSPIOP, false),
            } as any),
        });

        // Isolate database connections from ParticipantDomainModule by taking
        // the inbound and messaging modules from the definition imports.
        const dynamicImports = definition.imports ?? [];
        const messagingAndInboundImports = dynamicImports.filter(
            (m: any) => m !== undefined && m?.module?.name !== 'ParticipantDomainModule'
        );

        const moduleRef = await Test.createTestingModule({
            imports: messagingAndInboundImports,
            controllers: definition.controllers ?? [],
            providers: [
                {
                    provide: FspiopSettings,
                    useValue: new FspiopSettings('hub', '', '', '', false, false, ApiType.FSPIOP, false),
                },
                {
                    provide: Iso20022Transformer,
                    useValue: {},
                },
            ],
        })
            .overrideProvider(MESSAGE_BUS)
            .useValue(mockMessageBus)
            .compile();

        try {
            const commandBus = moduleRef.get(CommandBus);
            assert.ok(commandBus, 'CommandBus should be available in WebInboundModule');

            const handler = moduleRef.get(HandleGetPartiesHandler);
            assert.ok(handler, 'HandleGetPartiesHandler should be resolved');

            const controller = moduleRef.get(PartiesController);
            assert.ok(controller, 'PartiesController should be resolved');

            const domainBus = moduleRef.get<MessageBusPort>(MESSAGE_BUS_PORT);
            assert.ok(domainBus, 'MESSAGE_BUS_PORT should be resolved in the container');

            // Verify that calling publish on MESSAGE_BUS_PORT routes to our mockMessageBus
            await domainBus.publish('test.subject', { foo: 'bar' });
            assert.equal(published.length, 1);
            assert.equal(published[0].subject, 'test.subject');
            assert.deepEqual(published[0].message, { foo: 'bar' });
        } finally {
            await moduleRef.close();
        }
    });
});
