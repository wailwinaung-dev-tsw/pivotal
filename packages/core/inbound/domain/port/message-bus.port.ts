// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

export const MESSAGE_BUS_PORT = Symbol('MESSAGE_BUS_PORT');

export interface MessageBusPort {
    /**
     * Publishes a message to the event bus.
     * @param subject The target messaging subject
     * @param message The strongly-typed message payload or event contract
     */
    publish<T = unknown>(subject: string, message: T): Promise<void>;
}
