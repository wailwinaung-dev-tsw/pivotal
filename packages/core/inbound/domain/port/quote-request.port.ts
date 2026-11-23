// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { QuoteRequestMessage } from '@shared/messaging';

export const QUOTE_REQUEST_PORT = Symbol('QUOTE_REQUEST_PORT');

export interface QuoteRequestPort {
    publish(message: QuoteRequestMessage): Promise<void>;
}
