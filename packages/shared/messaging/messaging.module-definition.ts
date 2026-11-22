// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { MessagingOptions } from './messaging.schema';

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN: MESSAGING_OPTIONS_TOKEN,
    OPTIONS_TYPE: MESSAGING_OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE: MESSAGING_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<MessagingOptions>({ moduleName: 'Messaging' }).build();
