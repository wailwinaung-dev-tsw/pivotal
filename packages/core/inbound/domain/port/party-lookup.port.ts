// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { PartyLookupMessage } from '@shared/messaging';

export const PARTY_LOOKUP_PORT = Symbol('PARTY_LOOKUP_PORT');

export interface PartyLookupPort {
    publish(message: PartyLookupMessage): Promise<void>;
}
