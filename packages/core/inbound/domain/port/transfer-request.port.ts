// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { TransferRequestMessage } from '@shared/messaging';

export const TRANSFER_REQUEST_PORT = Symbol('TRANSFER_REQUEST_PORT');

export interface TransferRequestPort {
    publish(message: TransferRequestMessage): Promise<void>;
}
