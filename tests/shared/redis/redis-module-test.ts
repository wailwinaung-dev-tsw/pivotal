// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Inject, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
    IRedisClient,
    REDIS_CLIENT,
    RedisClientService,
    RedisModule,
    redisOptionsSchema,
} from '../../../packages/shared/redis';

@Injectable()
class ConsumerService {
    constructor(@Inject(REDIS_CLIENT) public readonly redis: IRedisClient) {}
}

describe('RedisModule (ConfigurableModuleBuilder + Zod)', () => {

    describe('redisOptionsSchema', () => {
        it('fails when url is not provided', () => {
            const result = redisOptionsSchema.safeParse({});
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /Redis URL is required/);
            }
        });

        it('fails when url is empty string', () => {
            const result = redisOptionsSchema.safeParse({ url: '' });
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /cannot be empty/);
            }
        });

        it('succeeds with valid url', () => {
            const result = redisOptionsSchema.safeParse({ url: 'redis://localhost:6379' });
            assert.equal(result.success, true);
            if (result.success) {
                assert.equal(result.data.url, 'redis://localhost:6379');
                assert.equal(result.data.defaultTtlMs, undefined);
            }
        });

        it('succeeds with valid url and defaultTtlMs', () => {
            const result = redisOptionsSchema.safeParse({
                url: 'redis://localhost:6379',
                defaultTtlMs: 30000,
            });
            assert.equal(result.success, true);
            if (result.success) {
                assert.equal(result.data.defaultTtlMs, 30000);
            }
        });
    });

    describe('RedisModule.register', () => {
        it('provides REDIS_CLIENT to consumers', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    RedisModule.register({
                        url: 'redis://localhost:6379',
                        defaultTtlMs: 5000,
                    }),
                ],
                providers: [ConsumerService],
            }).compile();

            const consumer = moduleRef.get(ConsumerService);
            const tokenClient = moduleRef.get<IRedisClient>(REDIS_CLIENT);

            assert.ok(consumer.redis);
            assert.equal(consumer.redis, tokenClient);
            assert.ok(typeof consumer.redis.get === 'function');
            assert.ok(typeof consumer.redis.set === 'function');
            assert.ok(typeof consumer.redis.delete === 'function');
            assert.ok(typeof consumer.redis.acquireLock === 'function');
            assert.ok(typeof consumer.redis.releaseLock === 'function');
            assert.ok(typeof consumer.redis.incrementWithTtl === 'function');
            assert.ok(typeof consumer.redis.reserve === 'function');
            assert.ok(typeof consumer.redis.rawClient === 'function');
        });
    });

    describe('RedisModule.registerAsync', () => {
        it('provides REDIS_CLIENT with async factory', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    RedisModule.registerAsync({
                        useFactory: () => ({
                            url: 'redis://127.0.0.1:6379',
                            defaultTtlMs: 10000,
                        }),
                    }),
                ],
                providers: [ConsumerService],
            }).compile();

            const consumer = moduleRef.get(ConsumerService);
            assert.ok(consumer.redis);
            assert.ok(consumer.redis.rawClient());
        });
    });
});
