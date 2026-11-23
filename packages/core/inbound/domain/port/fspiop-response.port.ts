// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
    ErrorInformationObject,
    PartiesTypeIDPutResponse,
    PartyIdType,
    QuoteSuccessPayload,
    TransfersIDPutResponse,
} from '@shared/fspiop';

export const FSPIOP_RESPONSE_PORT = Symbol('FSPIOP_RESPONSE_PORT');

export interface FspiopResponsePort {
    publishPartiesSuccess(params: {
        payerFsp: string;
        payeeFsp?: string | null;
        partyIdType: PartyIdType;
        partyId: string;
        subId?: string | null;
        response: PartiesTypeIDPutResponse;
    }): Promise<void>;

    publishPartiesError(params: {
        payerFsp: string;
        payeeFsp?: string | null;
        partyIdType: PartyIdType;
        partyId: string;
        subId?: string | null;
        error: ErrorInformationObject;
    }): Promise<void>;

    publishQuotesSuccess(params: {
        payerFsp: string;
        quoteId: string;
        payload: QuoteSuccessPayload;
    }): Promise<void>;

    publishQuotesError(params: {
        payerFsp: string;
        quoteId: string;
        error: ErrorInformationObject;
    }): Promise<void>;

    publishTransfersSuccess(params: {
        payerFsp: string;
        transferId: string;
        response: TransfersIDPutResponse;
    }): Promise<void>;

    publishTransfersError(params: {
        payerFsp: string;
        transferId: string;
        error: ErrorInformationObject;
    }): Promise<void>;
}
