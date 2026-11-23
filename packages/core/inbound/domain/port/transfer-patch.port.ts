// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { TransferPatchMessage } from '@shared/messaging';

export const TRANSFER_PATCH_PORT = Symbol('TRANSFER_PATCH_PORT');

export interface TransferPatchPort {
    publish(message: TransferPatchMessage): Promise<void>;
}
