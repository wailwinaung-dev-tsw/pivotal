// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { RedisOptions } from './redis.schema';

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN: REDIS_OPTIONS_TOKEN,
    OPTIONS_TYPE: REDIS_OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE: REDIS_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<RedisOptions>({ moduleName: 'Redis' }).build();
