// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, JSONCodec, NatsConnection } from 'nats';
import { IMessageBus, SubscriptionOptions } from '../../message-bus.interface';

@Injectable()
export class NatsMessageBusService implements IMessageBus, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(NatsMessageBusService.name);
    private readonly codec = JSONCodec();
    private connection?: NatsConnection;

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

    async publish(subject: string, data: unknown): Promise<void> {
        const js = this.nc.jetstream();
        const payload = this.codec.encode(data);
        await js.publish(subject, payload);
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
