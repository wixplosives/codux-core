import { readFileSync } from 'node:fs';
import { Logger } from 'vite';
import { FlatBoardSetup } from '../../types.js';

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

export function readBoardSetupFromCoduxConfig(coduxConfigPath: string, logger?: Logger): FlatBoardSetup {
    let config: KnownCoduxConfig | undefined = undefined;
    try {
        const configContent = readFileSync(coduxConfigPath, {
            encoding: 'utf-8',
        });
        config = JSON.parse(configContent) as KnownCoduxConfig;
    } catch (error) {
        logger?.error(
            `Error while parsing ${coduxConfigPath}.${error instanceof Error ? '\n' + error.message + '\n' + error.stack : String(error)}`,
        );

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

export function splitId(request: string) {
    if (request.indexOf('?') === -1) {
        return { specifier: request };
    }
    const [specifier, query] = request.split('?');
    return { specifier, query };
}
