// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import { PartyIdType } from '@shared/fspiop';
import {
    AuditMessagingSubjects,
    FspiopMessagingSubjects,
    PartyLookupMessage,
    QuoteRequestMessage,
    TransferPatchMessage,
    TransferRequestMessage,
} from '@shared/messaging';
import {
    MESSAGE_BUS_PORT,
    MessageBusPort,
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

describe('Inbound Domain Handlers (Pure Domain with MessageBusPort)', () => {
    const publishedMessages: Array<{ subject: string; message: any }> = [];

    const mockBus: MessageBusPort = {
        publish: async (subject, message) => {
            publishedMessages.push({ subject, message });
        },
    };

    it('HandleGetPartiesHandler publishes PartyLookupMessage via MessageBusPort', async () => {
        const handler = new HandleGetPartiesHandler(mockBus);
        await handler.execute(
            new HandleGetPartiesCommand(
                new HandleGetPartiesCommand.Input(
                    'corr-1',
                    'payer-fsp',
                    'payee-fsp',
                    PartyIdType.Msisdn,
                    '0912345678',
                    null,
                ),
            ),
        );

        const published = publishedMessages.find(p => p.subject === FspiopMessagingSubjects.partyLookup('payee-fsp'));
        assert.ok(published);
        assert.equal(published.message.payeeFsp, 'payee-fsp');
        assert.equal(published.message.partyId, '0912345678');
    });

    it('HandlePostQuotesHandler publishes via MessageBusPort', async () => {
        const handler = new HandlePostQuotesHandler(mockBus);
        await handler.execute(
            new HandlePostQuotesCommand(
                new HandlePostQuotesCommand.Input(
                    'corr-quote',
                    'payer-fsp',
                    'payee-fsp',
                    { quoteId: 'q-1', transactionId: 't-1', transactionRequestId: 'tr-1' } as any,
                ),
            ),
        );

        const audit = publishedMessages.find(p => p.subject === AuditMessagingSubjects.transaction);
        const quote = publishedMessages.find(p => p.subject === FspiopMessagingSubjects.postQuotes('payee-fsp'));
        assert.ok(audit);
        assert.ok(quote);
        assert.equal(quote.message.request.quoteId, 'q-1');
    });

    it('HandlePostTransfersHandler publishes via MessageBusPort', async () => {
        const handler = new HandlePostTransfersHandler(mockBus);
        await handler.execute(
            new HandlePostTransfersCommand(
                new HandlePostTransfersCommand.Input(
                    'corr-transfer',
                    'payer-fsp',
                    'payee-fsp',
                    { transferId: 'tf-1' } as any,
                ),
            ),
        );

        const transfer = publishedMessages.find(p => p.subject === FspiopMessagingSubjects.postTransfers('payee-fsp'));
        assert.ok(transfer);
        assert.equal(transfer.message.request.transferId, 'tf-1');
    });

    it('HandlePatchTransfersHandler publishes via MessageBusPort', async () => {
        const handler = new HandlePatchTransfersHandler(mockBus);
        await handler.execute(
            new HandlePatchTransfersCommand(
                new HandlePatchTransfersCommand.Input(
                    'corr-patch',
                    'payer-fsp',
                    'payee-fsp',
                    'tf-1',
                    { completedTimestamp: '2026-01-01' } as any,
                ),
            ),
        );

        const patch = publishedMessages.find(p => p.subject === FspiopMessagingSubjects.patchTransfers('payee-fsp'));
        assert.ok(patch);
        assert.equal(patch.message.transferId, 'tf-1');
    });

    it('HandlePutPartiesHandler publishes via MessageBusPort', async () => {
        const handler = new HandlePutPartiesHandler(mockBus);
        await handler.execute(
            new HandlePutPartiesCommand(
                new HandlePutPartiesCommand.Input(
                    'corr-parties-put',
                    'payer-fsp',
                    'payee-fsp',
                    PartyIdType.Msisdn,
                    '0912345678',
                    null,
                    { party: { partyIdInfo: { partyIdType: PartyIdType.Msisdn, partyIdentifier: '0912345678' } } } as any,
                ),
            ),
        );

        const published = publishedMessages.find(p => p.subject.includes('parties:payer-fsp:payee-fsp'));
        assert.ok(published);
    });

    it('HandlePutQuotesHandler publishes via MessageBusPort', async () => {
        const handler = new HandlePutQuotesHandler(mockBus);
        await handler.execute(
            new HandlePutQuotesCommand(
                new HandlePutQuotesCommand.Input(
                    'corr-put-quotes',
                    'payer-fsp',
                    'payee-fsp',
                    'q-1',
                    { transferAmount: { amount: '100', currency: 'MMK' } } as any,
                ),
            ),
        );

        const published = publishedMessages.find(p => p.subject.includes('quotes:payer-fsp:q-1'));
        assert.ok(published);
    });

    it('HandlePutTransfersHandler publishes via MessageBusPort', async () => {
        const handler = new HandlePutTransfersHandler(mockBus);
        await handler.execute(
            new HandlePutTransfersCommand(
                new HandlePutTransfersCommand.Input(
                    'corr-put-tf',
                    'payer-fsp',
                    'payee-fsp',
                    'tf-1',
                    { transferState: 'COMMITTED' } as any,
                ),
            ),
        );

        const published = publishedMessages.find(p => p.subject.includes('transfers:payer-fsp:tf-1'));
        assert.ok(published);
    });
});
