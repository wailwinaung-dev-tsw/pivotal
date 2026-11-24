// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.

import { PartyIdType } from '@shared/fspiop';

const RESPONSE_PREFIX = 'pivotal.fspiop.response.';

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

export namespace FspiopMessagingSubjects {
    export class Parties {
        private static readonly ANY_PAYEE = '_any_';

        static forSuccess(
            payer: string,
            payee: string | null | undefined,
            partyIdType: PartyIdType,
            partyId: string,
            subId?: string,
        ): string {
            const base = `${RESPONSE_PREFIX}parties:${payer}:${payee ?? Parties.ANY_PAYEE}:${partyIdType}:${partyId}`;
            return subId != null && subId.length > 0 ? `${base}:${subId}` : base;
        }

        static forError(
            payer: string,
            payeeOrHub: string | null | undefined,
            partyIdType: PartyIdType,
            partyId: string,
            subId?: string,
        ): string {
            const base = `${RESPONSE_PREFIX}parties-error:${payer}:${payeeOrHub ?? Parties.ANY_PAYEE}:${partyIdType}:${partyId}`;
            return subId != null && subId.length > 0 ? `${base}:${subId}` : base;
        }

        static toAnyPayeeSubject(subject: string): string | null {
            const successPrefix = `${RESPONSE_PREFIX}parties:`;
            const errorPrefix = `${RESPONSE_PREFIX}parties-error:`;
            const prefix = subject.startsWith(successPrefix)
                ? successPrefix
                : subject.startsWith(errorPrefix)
                    ? errorPrefix
                    : null;

            if (prefix == null) {
                return null;
            }

            const tokens = subject.slice(prefix.length).split(':');
            if (tokens.length < 4) {
                return null;
            }

            tokens[1] = Parties.ANY_PAYEE;
            return `${prefix}${tokens.join(':')}`;
        }
    }

    export class Quotes {
        static forSuccess(payer: string, quoteId: string): string {
            return `${RESPONSE_PREFIX}quotes:${payer}:${quoteId}`;
        }

        static forError(payer: string, quoteId: string): string {
            return `${RESPONSE_PREFIX}quotes-error:${payer}:${quoteId}`;
        }
    }

    export class Transfers {
        static forSuccess(payer: string, transferId: string): string {
            return `${RESPONSE_PREFIX}transfers:${payer}:${transferId}`;
        }

        static forError(payer: string, transferId: string): string {
            return `${RESPONSE_PREFIX}transfers-error:${payer}:${transferId}`;
        }
    }
}
