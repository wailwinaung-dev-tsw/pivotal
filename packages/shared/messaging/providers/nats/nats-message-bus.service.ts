// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, JSONCodec, NatsConnection } from 'nats';
import { IMessageBus, SubscriptionOptions } from '../../message-bus.interface';

const NO_STREAM_MATCHES_SUBJECT = 'no stream matches subject';
const STREAM_ALREADY_EXISTS = 'stream name already in use';
const DEFAULT_FSPIOP_STREAM_NAME = 'PIVOTAL_FSPIOP';
const DEFAULT_FSPIOP_STREAM_SUBJECT = 'fspiop.>';

@Injectable()
export class NatsMessageBusService implements IMessageBus, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(NatsMessageBusService.name);
    private readonly codec = JSONCodec();
    private connection?: NatsConnection;
    private fspiopStreamEnsured = false;

    constructor(private readonly url: string) {}

    async onModuleInit(): Promise<void> {
        if (!this.url || this.url.trim().length === 0) {
            return;
        }
        this.connection = await connect({ servers: this.url });
        this.logger.log(`NATS message bus connected to ${this.url}`);
    }

    async onModuleDestroy(): Promise<void> {
        if (this.connection) {
            await this.connection.drain();
            this.logger.log('NATS message bus drained connection');
        }
    }

    get nc(): NatsConnection {
        if (!this.connection) {
            throw new Error('NATS connection is not established. Verify that NATS is running and configured.');
        }
        return this.connection;
    }

    get isConnected(): boolean {
        return this.connection != null;
    }

    private async ensureFspiopStream(): Promise<void> {
        if (this.fspiopStreamEnsured) {
            return;
        }
        try {
            const js = this.nc.jetstream();
            const jsm = await js.jetstreamManager();
            const streamName = process.env['PIVOTAL_FSPIOP_STREAM_NAME'] ?? DEFAULT_FSPIOP_STREAM_NAME;

            try {
                await jsm.streams.find(DEFAULT_FSPIOP_STREAM_SUBJECT);
            } catch (findError: unknown) {
                const msg = (findError as { message?: string })?.message?.toLowerCase() ?? '';
                if (msg.includes(NO_STREAM_MATCHES_SUBJECT)) {
                    try {
                        await jsm.streams.add({
                            name: streamName,
                            subjects: [DEFAULT_FSPIOP_STREAM_SUBJECT],
                        });
                        this.logger.log(`Created stream '${streamName}' for subject '${DEFAULT_FSPIOP_STREAM_SUBJECT}'`);
                    } catch (addError: unknown) {
                        const addMsg = (addError as { message?: string })?.message?.toLowerCase() ?? '';
                        if (!addMsg.includes(STREAM_ALREADY_EXISTS)) {
                            this.logger.error(`Failed to create stream '${streamName}'`, addError);
                            throw addError;
                        }
                    }
                } else {
                    throw findError;
                }
            }
            this.fspiopStreamEnsured = true;
        } catch (error) {
            this.logger.warn(`Could not verify or auto-create stream for fspiop: ${error instanceof Error ? error.message : error}`);
        }
    }

    async publish(subject: string, data: unknown): Promise<void> {
        const js = this.nc.jetstream();
        if (subject.startsWith('fspiop.')) {
            await this.ensureFspiopStream();
        }
        const payload = this.codec.encode(data);
        try {
            await js.publish(subject, payload);
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message?.toLowerCase() ?? '';
            if (subject.startsWith('fspiop.') && msg.includes(NO_STREAM_MATCHES_SUBJECT)) {
                this.fspiopStreamEnsured = false;
                await this.ensureFspiopStream();
                await js.publish(subject, payload);
                return;
            }
            throw error;
        }
    }

    async subscribe(
        subject: string,
        handler: (data: unknown, rawMessage?: unknown) => Promise<void> | void,
        options?: SubscriptionOptions,
    ): Promise<void> {
        const js = this.nc.jetstream();
        if (options?.stream && options?.durable) {
            const consumer = await js.consumers.get(options.stream, options.durable);
            const messages = await consumer.consume();
            (async () => {
                for await (const msg of messages) {
                    try {
                        const decoded = this.codec.decode(msg.data);
                        await handler(decoded, msg);
                        msg.ack();
                    } catch (error) {
                        this.logger.error(`Error processing message on ${subject}`, error);
                        msg.nak();
                    }
                }
            })().catch((err) => {
                this.logger.error(`Consumer stream error on ${subject}`, err);
            });
        } else {
            // Core NATS subscription fallback
            const sub = this.nc.subscribe(subject);
            (async () => {
                for await (const msg of sub) {
                    try {
                        const decoded = this.codec.decode(msg.data);
                        await handler(decoded, msg);
                    } catch (error) {
                        this.logger.error(`Error processing core message on ${subject}`, error);
                    }
                }
            })().catch((err) => {
                this.logger.error(`Subscription error on ${subject}`, err);
            });
        }
    }
}
