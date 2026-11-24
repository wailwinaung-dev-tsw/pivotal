// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Inject, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PartyIdType } from '@shared/fspiop';
import {
    IMessageBus,
    MESSAGE_BUS,
    MessagingModule,
    messagingOptionsSchema,
    FspiopMessagingSubjects,
    PartyLookupMessage,
    QuoteRequestMessage,
    TransferRequestMessage,
    TransferPatchMessage,
    TransactionMessage,
} from '../../../packages/shared/messaging';

@Injectable()
class ConsumerService {
    constructor(@Inject(MESSAGE_BUS) public readonly bus: IMessageBus) {}
}

describe('MessagingModule (ConfigurableModuleBuilder + Zod with Nats Provider)', () => {

    describe('messagingOptionsSchema', () => {
        it('fails when url is not provided', () => {
            const result = messagingOptionsSchema.safeParse({});
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /Messaging URL is required/);
            }
        });

        it('fails when url is empty string', () => {
            const result = messagingOptionsSchema.safeParse({ url: '' });
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /cannot be empty/);
            }
        });

        it('fails when url is invalid', () => {
            const result = messagingOptionsSchema.safeParse({ url: 'invalid-url' });
            assert.equal(result.success, false);
            if (!result.success) {
                assert.match(result.error.issues[0].message, /Invalid Messaging URL format/);
            }
        });

        it('parses valid single url correctly', () => {
            const parsed = messagingOptionsSchema.parse({
                url: 'nats://localhost:4222',
            });
            assert.equal(parsed.url, 'nats://localhost:4222');
        });

        it('parses valid cluster urls correctly', () => {
            const parsed = messagingOptionsSchema.parse({
                url: 'nats://node1:4222,nats://node2:4222',
            });
            assert.equal(parsed.url, 'nats://node1:4222,nats://node2:4222');
        });
    });

    describe('register()', () => {
        it('provides MESSAGE_BUS token synchronously and encapsulates internal NATS provider', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    MessagingModule.register({
                        url: 'nats://sync-test:4222',
                    }),
                ],
                providers: [ConsumerService],
            }).compile();

            const consumer = moduleRef.get(ConsumerService);
            assert.ok(consumer.bus != null);
            assert.equal(typeof consumer.bus.publish, 'function');
            assert.equal(typeof consumer.bus.subscribe, 'function');

            // Verify that MESSAGE_BUS resolves cleanly
            const busFromToken = moduleRef.get<IMessageBus>(MESSAGE_BUS);
            assert.equal(busFromToken, consumer.bus);
        });
    });

    describe('registerAsync()', () => {
        it('provides MESSAGE_BUS token asynchronously', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    MessagingModule.registerAsync({
                        useFactory: () => ({
                            url: 'nats://async-test:4222',
                        }),
                    }),
                ],
                providers: [ConsumerService],
            }).compile();

            const consumer = moduleRef.get(ConsumerService);
            assert.ok(consumer.bus != null);
            assert.equal(typeof consumer.bus.publish, 'function');
            assert.equal(typeof consumer.bus.subscribe, 'function');
        });
    });

    describe('FspiopMessagingSubjects', () => {
        it('generates correct subject for partyLookup', () => {
            assert.equal(FspiopMessagingSubjects.partyLookup('bluebank'), 'fspiop.bluebank.get.parties');
        });

        it('generates correct subject for postQuotes', () => {
            assert.equal(FspiopMessagingSubjects.postQuotes('bluebank'), 'fspiop.bluebank.post.quotes');
        });

        it('generates correct subject for postTransfers', () => {
            assert.equal(FspiopMessagingSubjects.postTransfers('bluebank'), 'fspiop.bluebank.post.transfers');
        });

        it('generates correct subject for patchTransfers', () => {
            assert.equal(FspiopMessagingSubjects.patchTransfers('bluebank'), 'fspiop.bluebank.patch.transfers');
        });

        it('generates correct subjects for Parties responses', () => {
            assert.equal(
                FspiopMessagingSubjects.Parties.forSuccess('payer', 'payee', PartyIdType.Msisdn, '123'),
                'pivotal.fspiop.response.parties:payer:payee:MSISDN:123',
            );
            assert.equal(
                FspiopMessagingSubjects.Parties.forError('payer', 'payee', PartyIdType.Msisdn, '123'),
                'pivotal.fspiop.response.parties-error:payer:payee:MSISDN:123',
            );
        });

        it('generates correct subjects for Quotes responses', () => {
            assert.equal(
                FspiopMessagingSubjects.Quotes.forSuccess('payer', 'quote-1'),
                'pivotal.fspiop.response.quotes:payer:quote-1',
            );
            assert.equal(
                FspiopMessagingSubjects.Quotes.forError('payer', 'quote-1'),
                'pivotal.fspiop.response.quotes-error:payer:quote-1',
            );
        });

        it('generates correct subjects for Transfers responses', () => {
            assert.equal(
                FspiopMessagingSubjects.Transfers.forSuccess('payer', 'transfer-1'),
                'pivotal.fspiop.response.transfers:payer:transfer-1',
            );
            assert.equal(
                FspiopMessagingSubjects.Transfers.forError('payer', 'transfer-1'),
                'pivotal.fspiop.response.transfers-error:payer:transfer-1',
            );
        });
    });

    describe('Messaging Contracts', () => {
        it('creates PartyLookupMessage with all fields', () => {
            const msg = new PartyLookupMessage('corr-1', 'payer', 'payee', PartyIdType.Msisdn, '123456', 'sub-1');
            assert.equal(msg.correlationId, 'corr-1');
            assert.equal(msg.payerFsp, 'payer');
            assert.equal(msg.payeeFsp, 'payee');
            assert.equal(msg.partyIdType, PartyIdType.Msisdn);
            assert.equal(msg.partyId, '123456');
            assert.equal(msg.subId, 'sub-1');
        });

        it('creates QuoteRequestMessage with all fields', () => {
            const quoteReq = { quoteId: 'q-1', transactionId: 't-1' } as any;
            const msg = new QuoteRequestMessage('corr-2', 'payer', 'payee', quoteReq);
            assert.equal(msg.correlationId, 'corr-2');
            assert.equal(msg.payerFsp, 'payer');
            assert.equal(msg.payeeFsp, 'payee');
            assert.equal(msg.request, quoteReq);
            assert.equal(msg.iso20022PostQuoteRequest, undefined);
        });

        it('creates TransferRequestMessage with all fields', () => {
            const transferReq = { transferId: 'tr-1' } as any;
            const msg = new TransferRequestMessage('corr-3', 'payer', 'payee', transferReq);
            assert.equal(msg.correlationId, 'corr-3');
            assert.equal(msg.payerFsp, 'payer');
            assert.equal(msg.payeeFsp, 'payee');
            assert.equal(msg.request, transferReq);
        });

        it('creates TransferPatchMessage with all fields', () => {
            const patchRes = { completedTimestamp: '2026-01-01T00:00:00.000Z', transferState: 'COMMITTED' } as any;
            const msg = new TransferPatchMessage('corr-4', 'payer', 'payee', 'tr-1', patchRes);
            assert.equal(msg.correlationId, 'corr-4');
            assert.equal(msg.payerFsp, 'payer');
            assert.equal(msg.payeeFsp, 'payee');
            assert.equal(msg.transferId, 'tr-1');
            assert.equal(msg.response, patchRes);
        });

        it('creates TransactionMessage request/response/error/resolved factory methods', () => {
            const req = TransactionMessage.request(
                TransactionMessage.InvocationPhase.Quotes,
                TransactionMessage.InvocationGateway.Inbound,
                { correlationId: 'c-1', payerFsp: 'payer', payeeFsp: 'payee' },
            );
            assert.equal(req.phase, TransactionMessage.InvocationPhase.Quotes);
            assert.equal(req.action, TransactionMessage.InvocationAction.Request);
            assert.equal(req.gateway, TransactionMessage.InvocationGateway.Inbound);
            assert.equal((req.content as any).correlationId, 'c-1');

            const res = TransactionMessage.response(
                TransactionMessage.InvocationPhase.Transfers,
                TransactionMessage.InvocationGateway.Outbound,
                { correlationId: 'c-2', payerFsp: 'payer', payeeFsp: 'payee' },
            );
            assert.equal(res.action, TransactionMessage.InvocationAction.Response);

            const err = TransactionMessage.error(
                TransactionMessage.InvocationPhase.Quotes,
                TransactionMessage.InvocationGateway.Connector,
                { correlationId: 'c-3', payerFsp: 'payer', payeeFsp: 'payee', error: 'failed' },
            );
            assert.equal(err.action, TransactionMessage.InvocationAction.Error);
        });
    });

    describe('NatsMessageBusService Stream Auto-Provisioning', () => {
        it('provisions fspiop stream on first publish and caches resolution', async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    MessagingModule.register({
                        url: 'nats://test-stream:4222',
                    }),
                ],
            }).compile();

            const bus = moduleRef.get<any>(MESSAGE_BUS);

            let infoCalls = 0;
            let findCalls = 0;
            let addCalls = 0;
            let publishCalls = 0;

            const fakeJsm = {
                streams: {
                    info: async (name: string) => {
                        infoCalls++;
                        throw new Error('stream not found');
                    },
                    find: async (sub: string) => {
                        findCalls++;
                        throw new Error('no stream matches subject');
                    },
                    add: async (cfg: any) => {
                        addCalls++;
                        assert.equal(cfg.name, 'PIVOTAL_FSPIOP');
                        assert.deepEqual(cfg.subjects, ['fspiop.>']);
                    },
                },
            };

            const fakeJs = {
                jetstreamManager: async () => fakeJsm,
                publish: async (subject: string, data: any) => {
                    publishCalls++;
                },
            };

            // Stub connection & jetstream
            bus.connection = {
                jetstream: () => fakeJs,
            };

            // First publish - should detect fspiop., trigger info, find, add, and publish
            await bus.publish('fspiop.bluebank.post.quotes', { test: true });
            assert.equal(infoCalls, 1);
            assert.equal(findCalls, 1);
            assert.equal(addCalls, 1);
            assert.equal(publishCalls, 1);

            // Second publish - cached, should not call info, find or add again
            await bus.publish('fspiop.bluebank.post.transfers', { test: true });
            assert.equal(infoCalls, 1);
            assert.equal(findCalls, 1);
            assert.equal(addCalls, 1);
            assert.equal(publishCalls, 2);

            // Non-fspiop publish - should not trigger fspiop stream logic
            await bus.publish('other.subject', { test: true });
            assert.equal(infoCalls, 1);
            assert.equal(findCalls, 1);
            assert.equal(addCalls, 1);
            assert.equal(publishCalls, 3);
        });
    });
});
