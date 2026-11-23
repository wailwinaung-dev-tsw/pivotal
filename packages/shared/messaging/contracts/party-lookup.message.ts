// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { PartyIdType } from '@shared/fspiop';

export class PartyLookupMessage {
    constructor(
        public readonly correlationId: string | null,
        public readonly payerFsp: string,
        public readonly payeeFsp: string,
        public readonly partyIdType: PartyIdType,
        public readonly partyId: string,
        public readonly subId: string | null | undefined = null,
    ) {}
}
