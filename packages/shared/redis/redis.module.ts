// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './redis.module-definition';
import { REDIS_CLIENT } from './redis.interface';
import { RedisClientService } from './redis-client.service';

@Module({
    providers: [
        RedisClientService,
        {
            provide: REDIS_CLIENT,
            useExisting: RedisClientService,
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule extends ConfigurableModuleClass {}
