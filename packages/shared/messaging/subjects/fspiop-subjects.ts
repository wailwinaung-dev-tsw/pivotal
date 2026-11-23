// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

export class FspiopMessagingSubjects {
    static partyLookup(payeeFsp: string): string {
        return `fspiop.${payeeFsp}.get.parties`;
    }

    static postQuotes(payeeFsp: string): string {
        return `fspiop.${payeeFsp}.post.quotes`;
    }

    static postTransfers(payeeFsp: string): string {
        return `fspiop.${payeeFsp}.post.transfers`;
    }

    static patchTransfers(payeeFsp: string): string {
        return `fspiop.${payeeFsp}.patch.transfers`;
    }
}
