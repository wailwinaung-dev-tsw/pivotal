// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import { PartyIdType } from '@shared/fspiop';
import {
    PartyLookupMessage,
    QuoteRequestMessage,
    TransferPatchMessage,
    TransferRequestMessage,
} from '@shared/messaging';
import {
    PARTY_LOOKUP_PORT,
    PartyLookupPort,
    QUOTE_REQUEST_PORT,
    QuoteRequestPort,
    TRANSACTION_AUDIT_PORT,
    TransactionAuditPort,
    TRANSFER_PATCH_PORT,
    TransferPatchPort,
    TRANSFER_REQUEST_PORT,
    TransferRequestPort,
    FSPIOP_RESPONSE_PORT,
    FspiopResponsePort,
} from '../../../../packages/core/inbound/domain/port';
import {
    HandleGetPartiesCommand,
    HandleGetPartiesHandler,
    HandlePatchTransfersCommand,
    HandlePatchTransfersHandler,
    HandlePostQuotesCommand,
    HandlePostQuotesHandler,
    HandlePostTransfersCommand,
    HandlePostTransfersHandler,
} from '../../../../packages/core/inbound/domain/command/payee';
import {
    HandlePutPartiesCommand,
    HandlePutPartiesHandler,
    HandlePutQuotesCommand,
    HandlePutQuotesHandler,
    HandlePutTransfersCommand,
    HandlePutTransfersHandler,
} from '../../../../packages/core/inbound/domain/command/payer';

describe('Inbound Domain Handlers (Pure Domain with Ports)', () => {
    const publishedPartyLookups: PartyLookupMessage[] = [];
    const publishedQuoteRequests: QuoteRequestMessage[] = [];
    const publishedTransferRequests: TransferRequestMessage[] = [];
    const publishedTransferPatches: TransferPatchMessage[] = [];
    const publishedAuditMessages: any[] = [];
    const publishedResponseCalls: Array<{ method: string; params: any }> = [];

    const mockPartyLookupPort: PartyLookupPort = {
        publish: async (msg) => { publishedPartyLookups.push(msg); },
    };

    const mockQuoteRequestPort: QuoteRequestPort = {
        publish: async (msg) => { publishedQuoteRequests.push(msg); },
    };

    const mockTransferRequestPort: TransferRequestPort = {
        publish: async (msg) => { publishedTransferRequests.push(msg); },
    };

    const mockTransferPatchPort: TransferPatchPort = {
        publish: async (msg) => { publishedTransferPatches.push(msg); },
    };

    const mockAuditPort: TransactionAuditPort = {
        publish: async (msg) => { publishedAuditMessages.push(msg); },
    };

    const mockResponsePort: FspiopResponsePort = {
        publishPartiesSuccess: async (params) => { publishedResponseCalls.push({ method: 'partiesSuccess', params }); },
        publishPartiesError: async (params) => { publishedResponseCalls.push({ method: 'partiesError', params }); },
        publishQuotesSuccess: async (params) => { publishedResponseCalls.push({ method: 'quotesSuccess', params }); },
        publishQuotesError: async (params) => { publishedResponseCalls.push({ method: 'quotesError', params }); },
        publishTransfersSuccess: async (params) => { publishedResponseCalls.push({ method: 'transfersSuccess', params }); },
        publishTransfersError: async (params) => { publishedResponseCalls.push({ method: 'transfersError', params }); },
    };

    const setupTestModule = async () => {
        publishedPartyLookups.length = 0;
        publishedQuoteRequests.length = 0;
        publishedTransferRequests.length = 0;
        publishedTransferPatches.length = 0;
        publishedAuditMessages.length = 0;
        publishedResponseCalls.length = 0;

        return Test.createTestingModule({
            providers: [
                HandleGetPartiesHandler,
                HandlePostQuotesHandler,
                HandlePostTransfersHandler,
                HandlePatchTransfersHandler,
                HandlePutPartiesHandler,
                HandlePutQuotesHandler,
                HandlePutTransfersHandler,
                { provide: PARTY_LOOKUP_PORT, useValue: mockPartyLookupPort },
                { provide: QUOTE_REQUEST_PORT, useValue: mockQuoteRequestPort },
                { provide: TRANSFER_REQUEST_PORT, useValue: mockTransferRequestPort },
                { provide: TRANSFER_PATCH_PORT, useValue: mockTransferPatchPort },
                { provide: TRANSACTION_AUDIT_PORT, useValue: mockAuditPort },
                { provide: FSPIOP_RESPONSE_PORT, useValue: mockResponsePort },
            ],
        }).compile();
    };

    it('HandleGetPartiesHandler publishes PartyLookupMessage via PartyLookupPort', async () => {
        const moduleRef = await setupTestModule();
        const handler = moduleRef.get(HandleGetPartiesHandler);

        const command = new HandleGetPartiesCommand(
            new HandleGetPartiesCommand.Input(
                'corr-get-parties',
                'payer-bank',
                'payee-bank',
                PartyIdType.Msisdn,
                '123456789',
                'sub-1',
            ),
        );

        await handler.execute(command);

        assert.equal(publishedPartyLookups.length, 1);
        const data = publishedPartyLookups[0];
        assert.ok(data instanceof PartyLookupMessage);
        assert.equal(data.payerFsp, 'payer-bank');
        assert.equal(data.payeeFsp, 'payee-bank');
        assert.equal(data.partyIdType, PartyIdType.Msisdn);
        assert.equal(data.partyId, '123456789');
        assert.equal(data.subId, 'sub-1');
    });

    it('HandlePostQuotesHandler publishes via QuoteRequestPort and TransactionAuditPort', async () => {
        const moduleRef = await setupTestModule();
        const handler = moduleRef.get(HandlePostQuotesHandler);

        const quoteRequest = {
            quoteId: 'quote-100',
            transactionId: 'tx-100',
            transactionRequestId: 'txreq-100',
            amount: '100',
            currency: 'USD',
        } as any;

        const command = new HandlePostQuotesCommand(
            new HandlePostQuotesCommand.Input(
                'corr-quotes',
                'payer-bank',
                'payee-bank',
                quoteRequest,
            ),
        );

        await handler.execute(command);

        assert.equal(publishedQuoteRequests.length, 1);
        const data = publishedQuoteRequests[0];
        assert.ok(data instanceof QuoteRequestMessage);
        assert.equal(data.payerFsp, 'payer-bank');
        assert.equal(data.payeeFsp, 'payee-bank');
        assert.equal(data.request, quoteRequest);

        assert.equal(publishedAuditMessages.length, 1);
    });

    it('HandlePostTransfersHandler publishes via TransferRequestPort and TransactionAuditPort', async () => {
        const moduleRef = await setupTestModule();
        const handler = moduleRef.get(HandlePostTransfersHandler);

        const transferRequest = {
            transferId: 'tr-100',
            amount: '50',
            currency: 'USD',
        } as any;

        const command = new HandlePostTransfersCommand(
            new HandlePostTransfersCommand.Input(
                'corr-transfers',
                'payer-bank',
                'payee-bank',
                transferRequest,
            ),
        );

        await handler.execute(command);

        assert.equal(publishedTransferRequests.length, 1);
        const data = publishedTransferRequests[0];
        assert.ok(data instanceof TransferRequestMessage);
        assert.equal(data.payerFsp, 'payer-bank');
        assert.equal(data.payeeFsp, 'payee-bank');
        assert.equal(data.request, transferRequest);

        assert.equal(publishedAuditMessages.length, 1);
    });

    it('HandlePatchTransfersHandler publishes via TransferPatchPort and TransactionAuditPort', async () => {
        const moduleRef = await setupTestModule();
        const handler = moduleRef.get(HandlePatchTransfersHandler);

        const patchResponse = {
            completedTimestamp: '2026-01-01T00:00:00.000Z',
            transferState: 'COMMITTED',
        } as any;

        const command = new HandlePatchTransfersCommand(
            new HandlePatchTransfersCommand.Input(
                'corr-patch',
                'payer-bank',
                'payee-bank',
                'tr-100',
                patchResponse,
            ),
        );

        await handler.execute(command);

        assert.equal(publishedTransferPatches.length, 1);
        const data = publishedTransferPatches[0];
        assert.ok(data instanceof TransferPatchMessage);
        assert.equal(data.payerFsp, 'payer-bank');
        assert.equal(data.payeeFsp, 'payee-bank');
        assert.equal(data.transferId, 'tr-100');
        assert.equal(data.response, patchResponse);

        assert.equal(publishedAuditMessages.length, 1);
    });

    it('HandlePutPartiesHandler publishes via FspiopResponsePort', async () => {
        const moduleRef = await setupTestModule();
        const handler = moduleRef.get(HandlePutPartiesHandler);

        const putPartiesResponse = { party: { partyIdInfo: { partyIdType: PartyIdType.Msisdn, partyIdentifier: '123' } } } as any;

        const command = new HandlePutPartiesCommand(
            new HandlePutPartiesCommand.Input(
                'corr-put-parties',
                'payer-fsp',
                'payee-fsp',
                PartyIdType.Msisdn,
                '123',
                null,
                putPartiesResponse,
            ),
        );

        await handler.execute(command);

        assert.equal(publishedResponseCalls.length, 1);
        assert.equal(publishedResponseCalls[0].method, 'partiesSuccess');
        assert.equal(publishedResponseCalls[0].params.payerFsp, 'payer-fsp');
        assert.equal(publishedResponseCalls[0].params.response, putPartiesResponse);
    });

    it('HandlePutQuotesHandler publishes via FspiopResponsePort and TransactionAuditPort', async () => {
        const moduleRef = await setupTestModule();
        const handler = moduleRef.get(HandlePutQuotesHandler);

        const putQuotesResponse = { transferAmount: { amount: '100', currency: 'USD' } } as any;

        const command = new HandlePutQuotesCommand(
            new HandlePutQuotesCommand.Input(
                'corr-put-quotes',
                'payer-fsp',
                'payee-fsp',
                'quote-100',
                putQuotesResponse,
            ),
        );

        await handler.execute(command);

        assert.equal(publishedResponseCalls.length, 1);
        assert.equal(publishedResponseCalls[0].method, 'quotesSuccess');
        assert.equal(publishedResponseCalls[0].params.payerFsp, 'payer-fsp');
        assert.equal(publishedResponseCalls[0].params.quoteId, 'quote-100');
        assert.equal(publishedResponseCalls[0].params.payload.response, putQuotesResponse);

        assert.equal(publishedAuditMessages.length, 1);
    });

    it('HandlePutTransfersHandler publishes via FspiopResponsePort and TransactionAuditPort', async () => {
        const moduleRef = await setupTestModule();
        const handler = moduleRef.get(HandlePutTransfersHandler);

        const putTransfersResponse = { transferState: 'COMMITTED', completedTimestamp: '2026-01-01' } as any;

        const command = new HandlePutTransfersCommand(
            new HandlePutTransfersCommand.Input(
                'corr-put-transfers',
                'payer-fsp',
                'payee-fsp',
                'tr-100',
                putTransfersResponse,
            ),
        );

        await handler.execute(command);

        assert.equal(publishedResponseCalls.length, 1);
        assert.equal(publishedResponseCalls[0].method, 'transfersSuccess');
        assert.equal(publishedResponseCalls[0].params.payerFsp, 'payer-fsp');
        assert.equal(publishedResponseCalls[0].params.transferId, 'tr-100');
        assert.equal(publishedResponseCalls[0].params.response, putTransfersResponse);

        assert.equal(publishedAuditMessages.length, 1);
    });
});
