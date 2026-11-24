// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { z } from 'zod';

export const messagingOptionsSchema = z.object({
    url: z.string({ message: 'Messaging URL is required' })
        .min(1, 'Messaging URL cannot be empty')
        .refine((val) => {
            return val.split(',').every((server) => {
                try {
                    new URL(server.trim());
                    return true;
                } catch {
                    return false;
                }
            });
        }, { message: 'Invalid Messaging URL format (e.g. nats://localhost:4222)' }),
    streamName: z.string().min(1).optional(),
    timeoutMs: z.number().positive().optional(),
});

export type MessagingOptions = z.infer<typeof messagingOptionsSchema>;
