// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {DynamicModule, Module, Provider} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';
import {
    ParticipantDomainModule,
    ParticipantJwsPolicyStore,
    ParticipantJwsPublicKeyStore,
    ParticipantRepository,
} from '@core/participant/domain';
import {InboundDomainModule} from '@core/inbound/domain';
import {MESSAGE_BUS, MessagingModule} from '@shared/messaging';
import {FspInboundGuard, FspiopSettings} from '@shared/fspiop';
import {PartiesController, QuotesController, TransfersController,} from './controllers';
import {WebInboundSettings} from './required.settings';
import {ParticipantSigningKeysCache} from "@core/participant/domain/component/store/participant-signing-keys-cache";
import {Iso20022Transformer} from '@shared/iso20022/iso20022-transformer';
import {RepresentationHeaderGuard} from './representation-header.guard';

const REQUIRED_SETTINGS = Symbol('WebInboundRequiredSettings');

@Module({})
export class WebInboundModule {

    static forRoot(): DynamicModule {
        return WebInboundModule.forRootAsync({
                                                 useFactory: (): WebInboundModule.RequiredSettings => new WebInboundSettings(),
                                             });
    }

    static forRootAsync(asyncOptions: WebInboundModule.AsyncOptions): DynamicModule {
        const messagingModule = MessagingModule.registerAsync({
            imports: asyncOptions.imports ?? [],
            inject: asyncOptions.inject ?? [],
            useFactory: async (...args: any[]) => {
                const settings = await asyncOptions.useFactory(...args);
                return {
                    url: settings.natsUrl?.() ?? 'nats://localhost:4222',
                };
            },
        });

        const inboundDomainModule = InboundDomainModule.register({
            imports: [messagingModule],
            messageBus: { useExisting: MESSAGE_BUS },
        });

        return {
            module: WebInboundModule,
            imports: [
                ParticipantDomainModule.forRootAsync({
                    imports: asyncOptions.imports ?? [],
                    inject: asyncOptions.inject ?? [],
                    useFactory: asyncOptions.useFactory,
                }),
                messagingModule,
                inboundDomainModule,
                ...(asyncOptions.imports ?? []),
            ],
            controllers: [
                PartiesController,
                QuotesController,
                TransfersController,
            ],
            providers: [
                ...WebInboundModule.createProviders(asyncOptions),
                {provide: APP_GUARD, useClass: RepresentationHeaderGuard},
            ],
        };
    }

    private static createProviders(asyncOptions: WebInboundModule.AsyncOptions): Provider[] {
        return [
            {
                provide: REQUIRED_SETTINGS,
                useFactory: asyncOptions.useFactory,
                inject: asyncOptions.inject ?? [],
            },
            {
                provide: FspiopSettings,
                useFactory: (settings: WebInboundModule.RequiredSettings): FspiopSettings => settings.fspiopSettings(),
                inject: [REQUIRED_SETTINGS],
            },
            {
                provide: Iso20022Transformer,
                useFactory: (settings: FspiopSettings): Iso20022Transformer => {
                    return new Iso20022Transformer(settings);
                },
                inject: [FspiopSettings],
            },
            {
                provide: FspInboundGuard,
                useFactory: (fspiopSettings: FspiopSettings, participantSigningKeysCache: ParticipantSigningKeysCache): FspInboundGuard => {
                    return new FspInboundGuard(
                        new ParticipantJwsPublicKeyStore(participantSigningKeysCache),
                        fspiopSettings,
                        new ParticipantJwsPolicyStore(
                            participantSigningKeysCache,
                            fspiopSettings.defaultJwsVerifyMode,
                        ),
                    );
                },
                inject: [FspiopSettings, ParticipantSigningKeysCache],
            }
        ];
    }

}

export namespace WebInboundModule {

    export interface RequiredSettings
        extends ParticipantDomainModule.RequiredSettings {
        natsUrl(): string;
        fspiopSettings(): FspiopSettings;
    }

    export type AsyncOptions = {
        imports?: any[];
        useFactory: (...args: any[]) => RequiredSettings | Promise<RequiredSettings>;
        inject?: any[];
    };
}
