// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { TransactionMessage } from '@shared/messaging';

export const TRANSACTION_AUDIT_PORT = Symbol('TRANSACTION_AUDIT_PORT');

export interface TransactionAuditPort {
    publish(message: TransactionMessage): Promise<void>;
}
