// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { z } from 'zod';

export const redisOptionsSchema = z.object({
    url: z.string({ message: 'Redis URL is required' })
        .min(1, 'Redis URL cannot be empty'),
    defaultTtlMs: z.number().int().nonnegative().optional(),
});

export type RedisOptions = z.infer<typeof redisOptionsSchema>;
