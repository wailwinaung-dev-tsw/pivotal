// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Inject, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
    IMessageBus,
    MESSAGE_BUS,
    MessagingModule,
    messagingOptionsSchema,
} from '../../../packages/shared/messaging';

@Injectable()
class ConsumerService {
    constructor(@Inject(MESSAGE_BUS) public readonly bus: IMessageBus) {}
}

describe('MessagingModule (ConfigurableModuleBuilder + Zod with Nats Provider)', () => {

    describe('messagingOptionsSchema', () => {
        it('fails when url is not provided', () => {
            const result = messagingOptionsSchema.safeParse({});
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /Messaging URL is required/);
            }
        });

        it('fails when url is empty string', () => {
            const result = messagingOptionsSchema.safeParse({ url: '' });
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /cannot be empty/);
            }
        });

        it('fails when url is invalid', () => {
            const result = messagingOptionsSchema.safeParse({ url: 'invalid-url' });
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /Invalid Messaging URL format/);
            }
        });

        it('parses valid single url correctly', () => {
            const parsed = messagingOptionsSchema.parse({
                url: 'nats://localhost:4222',
            });
            assert.equal(parsed.url, 'nats://localhost:4222');
        });

        it('parses valid cluster urls correctly', () => {
            const parsed = messagingOptionsSchema.parse({
                url: 'nats://node1:4222,nats://node2:4222',
            });
            assert.equal(parsed.url, 'nats://node1:4222,nats://node2:4222');
        });
    });

    describe('register()', () => {
        it('provides MESSAGE_BUS token synchronously and encapsulates internal NATS provider', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    MessagingModule.register({
                        url: 'nats://sync-test:4222',
                    }),
                ],
                providers: [ConsumerService],
            }).compile();

            const consumer = moduleRef.get(ConsumerService);
            assert.ok(consumer.bus != null);
            assert.equal(typeof consumer.bus.publish, 'function');
            assert.equal(typeof consumer.bus.subscribe, 'function');

            // Verify that MESSAGE_BUS resolves cleanly
            const busFromToken = moduleRef.get<IMessageBus>(MESSAGE_BUS);
            assert.equal(busFromToken, consumer.bus);
        });
    });

    describe('registerAsync()', () => {
        it('provides MESSAGE_BUS token asynchronously', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    MessagingModule.registerAsync({
                        useFactory: () => ({
                            url: 'nats://async-test:4222',
                        }),
                    }),
                ],
                providers: [ConsumerService],
            }).compile();

            const consumer = moduleRef.get(ConsumerService);
            assert.ok(consumer.bus != null);
            assert.equal(typeof consumer.bus.publish, 'function');
            assert.equal(typeof consumer.bus.subscribe, 'function');
        });
    });
});
