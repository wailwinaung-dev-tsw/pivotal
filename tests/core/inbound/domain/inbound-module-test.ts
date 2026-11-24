// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import {
    InboundDomainModule,
    MESSAGE_BUS_PORT,
    MessageBusPort,
    HandleGetPartiesHandler,
    HandlePostQuotesHandler,
    HandlePutPartiesHandler,
} from '../../../../packages/core/inbound/domain';

describe('InboundDomainModule (ConfigurableModuleBuilder with MessageBusPort)', () => {
    const mockBus: MessageBusPort = {
        publish: async () => {},
    };

    it('successfully registers synchronously with messageBus port provided', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                InboundDomainModule.register({
                    messageBus: { useValue: mockBus },
                }),
            ],
        }).compile();

        // Check port resolution
        const bus = moduleRef.get<MessageBusPort>(MESSAGE_BUS_PORT);
        assert.equal(bus, mockBus);

        // Check command handlers resolution
        const getPartiesHandler = moduleRef.get(HandleGetPartiesHandler);
        const postQuotesHandler = moduleRef.get(HandlePostQuotesHandler);
        const putPartiesHandler = moduleRef.get(HandlePutPartiesHandler);

        assert.ok(getPartiesHandler);
        assert.ok(postQuotesHandler);
        assert.ok(putPartiesHandler);
    });

    it('successfully registers asynchronously with useClass and useFactory bindings', async () => {
        class CustomBusAdapter implements MessageBusPort {
            async publish(): Promise<void> {}
        }

        const moduleRef = await Test.createTestingModule({
            imports: [
                InboundDomainModule.registerAsync({
                    messageBus: { useClass: CustomBusAdapter },
                    useFactory: () => ({}),
                }),
            ],
        }).compile();

        const bus = moduleRef.get<MessageBusPort>(MESSAGE_BUS_PORT);
        assert.ok(bus instanceof CustomBusAdapter);
    });
});
