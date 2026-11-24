// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import {
    NatsClientService,
    NatsClientServiceModule,
    natsOptionsSchema,
} from '../../../../packages/shared/nats';

describe('NatsClientServiceModule (ConfigurableModuleBuilder + Zod)', () => {

    describe('natsOptionsSchema', () => {
        it('fails when url is not provided', () => {
            const result = natsOptionsSchema.safeParse({});
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /NATS URL is required/);
            }
        });

        it('fails when url is empty string', () => {
            const result = natsOptionsSchema.safeParse({ url: '' });
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /cannot be empty/);
            }
        });

        it('fails when url is not a valid URL format', () => {
            const result = natsOptionsSchema.safeParse({ url: 'not-a-valid-url' });
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /Invalid NATS URL format/);
            }
        });

        it('parses valid single url correctly', () => {
            const parsed = natsOptionsSchema.parse({ url: 'nats://localhost:4222' });
            assert.equal(parsed.url, 'nats://localhost:4222');
        });

        it('parses valid comma-separated cluster urls correctly', () => {
            const parsed = natsOptionsSchema.parse({ url: 'nats://node1:4222,nats://node2:4222' });
            assert.equal(parsed.url, 'nats://node1:4222,nats://node2:4222');
        });
    });

    describe('register()', () => {
        it('provides NatsClientService with synchronous options', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    NatsClientServiceModule.register({ url: 'nats://demo:4222' }),
                ],
            }).compile();

            const natsService = moduleRef.get(NatsClientService);
            assert.ok(natsService instanceof NatsClientService);
            assert.equal((natsService as any).natsUrl, 'nats://demo:4222');
        });
    });

    describe('registerAsync()', () => {
        it('provides NatsClientService with async factory', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    NatsClientServiceModule.registerAsync({
                        useFactory: () => ({ url: 'nats://async-demo:4222' }),
                    }),
                ],
            }).compile();

            const natsService = moduleRef.get(NatsClientService);
            assert.ok(natsService instanceof NatsClientService);
            assert.equal((natsService as any).natsUrl, 'nats://async-demo:4222');
        });
    });

    describe('legacy forRootAsync()', () => {
        it('continues to support legacy RequiredSettings callers', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    NatsClientServiceModule.forRootAsync({
                        useFactory: () => ({
                            natsUrl: () => 'nats://legacy:4222',
                        }),
                    }),
                ],
            }).compile();

            const natsService = moduleRef.get(NatsClientService);
            assert.ok(natsService instanceof NatsClientService);
            assert.equal((natsService as any).natsUrl, 'nats://legacy:4222');
        });
    });
});
