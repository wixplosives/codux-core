import { readFileSync } from 'fs';
import path from 'path';

type GlobalSetupConfig =
    | string
    | undefined
    | {
          before?: string;
          after?: string;
      };

type KnownCoduxConfig = {
    boardGlobalSetup?: GlobalSetupConfig;
};

export type FlatBoardSetup = {
    setupBefore: string | undefined;
    setupAfter: string | undefined;
};

export function readBoardSetupFromCoduxConfig(coduxConfigPath: string): FlatBoardSetup {
    const configContent = readFileSync(coduxConfigPath, {
        encoding: 'utf-8',
    });
    let config: KnownCoduxConfig | undefined = undefined;
    try {
        config = JSON.parse(configContent);
    } catch (error) {
        return {
            setupBefore: undefined,
            setupAfter: undefined,
        };
    }
    if (config && 'boardGlobalSetup' in config) {
        if (typeof config.boardGlobalSetup === 'string') {
            return {
                setupBefore: path.resolve(config.boardGlobalSetup),
                setupAfter: undefined,
            };
        }

        if (
            typeof config.boardGlobalSetup === 'object' &&
            ('before' in config.boardGlobalSetup || 'after' in config.boardGlobalSetup)
        ) {
            return {
                setupBefore: config.boardGlobalSetup.before ? path.resolve(config.boardGlobalSetup.before) : undefined,
                setupAfter: config.boardGlobalSetup.after ? path.resolve(config.boardGlobalSetup.after) : undefined,
            };
        }
    }

    return {
        setupBefore: undefined,
        setupAfter: undefined,
    };
}
