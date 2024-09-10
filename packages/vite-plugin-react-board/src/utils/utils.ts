import { readFileSync } from 'fs';
import { Logger } from 'vite';

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

export function readBoardSetupFromCoduxConfig(coduxConfigPath: string, logger?: Logger): FlatBoardSetup {
    const configContent = readFileSync(coduxConfigPath, {
        encoding: 'utf-8',
    });
    let config: KnownCoduxConfig | undefined = undefined;
    try {
        config = JSON.parse(configContent) as KnownCoduxConfig;
    } catch (error) {
        logger?.error(`Error while parsing ${coduxConfigPath} with: ${String(error)}`);

        return {
            setupBefore: undefined,
            setupAfter: undefined,
        };
    }
    if (config && 'boardGlobalSetup' in config) {
        if (typeof config.boardGlobalSetup === 'string') {
            return {
                setupBefore: config.boardGlobalSetup,
                setupAfter: undefined,
            };
        }

        if (
            typeof config.boardGlobalSetup === 'object' &&
            ('before' in config.boardGlobalSetup || 'after' in config.boardGlobalSetup)
        ) {
            return {
                setupBefore: config.boardGlobalSetup.before,
                setupAfter: config.boardGlobalSetup.after,
            };
        }
    }

    return {
        setupBefore: undefined,
        setupAfter: undefined,
    };
}
