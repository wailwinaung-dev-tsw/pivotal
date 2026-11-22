// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

export interface SubscriptionOptions {
    durable?: string;
    stream?: string;
}

export interface IMessageBus {
    publish(subject: string, data: unknown): Promise<void>;
    subscribe(
        subject: string,
        handler: (data: unknown, rawMessage?: unknown) => Promise<void> | void,
        options?: SubscriptionOptions,
    ): Promise<void>;
}

export const MESSAGE_BUS = Symbol('IMessageBus');
