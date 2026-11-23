// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

export const MESSAGE_BUS_PORT = Symbol('MESSAGE_BUS_PORT');

export interface MessageBusPort {
    publish(subject: string, message: unknown): Promise<void>;
}
