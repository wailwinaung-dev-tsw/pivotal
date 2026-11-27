// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { RedisClientType } from 'redis';

export interface IRedisClient {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
    delete(key: string): Promise<void>;
    incrementWithTtl(key: string, ttlMs: number): Promise<number>;
    reserve(key: string, ttlMs: number): Promise<boolean>;
    acquireLock(key: string, ttlMs: number): Promise<string | undefined>;
    releaseLock(key: string, token: string): Promise<void>;
    rawClient(): RedisClientType;
}

export const REDIS_CLIENT = Symbol('IRedisClient');
