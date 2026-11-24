// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { WebInboundModule } from '../../../packages/apps/web-inbound/web-inbound.module';
import { MESSAGE_BUS, MessagingModule, IMessageBus } from '../../../packages/shared/messaging';
import { InboundDomainModule, MESSAGE_BUS_PORT, MessageBusPort, HandleGetPartiesHandler } from '../../../packages/core/inbound/domain';
import { FspiopSettings } from '../../../packages/shared/fspiop/component/fspiop-settings';
import { ApiType } from '../../../packages/shared/iso20022/api-type';

describe('WebInboundModule Wiring (Clean Architecture)', () => {
    it('correctly wires MessagingModule to InboundDomainModule in dynamic module definition', () => {
        const definition = WebInboundModule.forRootAsync({
            useFactory: () => ({
                natsUrl: () => 'nats://localhost:4222',
                fspiopSettings: () => new FspiopSettings('hub', '', '', '', false, false, ApiType.FSPIOP, false),
            } as any),
        });

        // 1. Verify that InboundDomainModule is present in WebInboundModule.imports
        const importedModules = definition.imports ?? [];
        const inboundModuleDef = importedModules.find(
            (m: any) => m?.module === InboundDomainModule
        );
        assert.ok(inboundModuleDef, 'InboundDomainModule must be included in WebInboundModule.imports');

        // 2. Verify that InboundDomainModule imports MessagingModule
        const inboundImports = (inboundModuleDef as any).imports ?? [];
        const messagingModuleDef = inboundImports.find(
            (m: any) => m?.module === MessagingModule
        );
        assert.ok(messagingModuleDef, 'InboundDomainModule must import MessagingModule');

        // 3. Verify that InboundDomainModule binds MESSAGE_BUS_PORT to MESSAGE_BUS
        const providers = (inboundModuleDef as any).providers ?? [];
        const portBinding = providers.find(
            (p: any) => p?.provide === MESSAGE_BUS_PORT
        );
        assert.ok(portBinding, 'MESSAGE_BUS_PORT must be provided in InboundDomainModule');
        assert.equal(portBinding.useExisting, MESSAGE_BUS, 'MESSAGE_BUS_PORT must bind to MESSAGE_BUS token');
    });

    it('resolves CommandBus, domain handlers, and MESSAGE_BUS_PORT in Nest DI container', async () => {
        const published: Array<{ subject: string; message: unknown }> = [];
        const mockMessageBus: IMessageBus = {
            publish: async (subject: string, message: unknown): Promise<void> => {
                published.push({ subject, message });
            },
            subscribe: async (): Promise<any> => ({
                unsubscribe: async (): Promise<void> => {},
            }),
        };

        const moduleRef = await Test.createTestingModule({
            imports: [
                InboundDomainModule.register({
                    providers: [
                        {
                            provide: MESSAGE_BUS_PORT,
                            useValue: mockMessageBus,
                        },
                    ],
                }),
            ],
        }).compile();

        try {
            const commandBus = moduleRef.get(CommandBus);
            assert.ok(commandBus, 'CommandBus should be resolved');

            const handler = moduleRef.get(HandleGetPartiesHandler);
            assert.ok(handler, 'HandleGetPartiesHandler should be resolved');

            const domainBus = moduleRef.get<MessageBusPort>(MESSAGE_BUS_PORT);
            assert.ok(domainBus, 'MESSAGE_BUS_PORT should be resolved in the container');

            // Verify that publishing through the port routes to the underlying bus
            await domainBus.publish('test.subject', { foo: 'bar' });
            assert.equal(published.length, 1);
            assert.equal(published[0].subject, 'test.subject');
            assert.deepEqual(published[0].message, { foo: 'bar' });
        } finally {
            await moduleRef.close();
        }
    });
});
