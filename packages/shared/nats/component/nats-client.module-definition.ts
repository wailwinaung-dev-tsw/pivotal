// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { NatsOptions } from './nats.schema';

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN: NATS_OPTIONS_TOKEN,
    OPTIONS_TYPE: NATS_OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE: NATS_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<NatsOptions>({ moduleName: 'Nats' }).build();
