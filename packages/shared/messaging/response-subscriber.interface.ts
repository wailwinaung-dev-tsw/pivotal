// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

export type Waiter<T> = {
    readonly promise: Promise<T>;
    cancel(): void;
};

export interface IResponseSubscriber {
    waitFor<T>(
        successSubject: string,
        errorSubject: string,
        hubErrorSubject?: string,
        timeoutMs?: number,
    ): Waiter<T>;
}

export const RESPONSE_SUBSCRIBER = Symbol('IResponseSubscriber');
