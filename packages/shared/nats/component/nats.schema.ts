// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { z } from 'zod';

export const natsOptionsSchema = z.object({
    url: z.string({ message: 'NATS URL is required' })
        .min(1, 'NATS URL cannot be empty')
        .refine((val) => {
            return val.split(',').every((server) => {
                try {
                    new URL(server.trim());
                    return true;
                } catch {
                    return false;
                }
            });
        }, { message: 'Invalid NATS URL format (e.g. nats://localhost:4222)' }),
});

export type NatsOptions = z.infer<typeof natsOptionsSchema>;
