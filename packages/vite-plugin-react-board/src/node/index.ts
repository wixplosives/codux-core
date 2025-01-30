import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { PluginOption, ResolvedConfig } from 'vite';
import { readBoardSetupFromCoduxConfig, splitId } from './utils/utils.js';
import { URLSearchParams } from 'node:url';

const coduxConfigFileName = 'codux.config.json';
const noopId = 'virtual:codux/noop';
const queryPlaceholder = '__BOARD_PATH_QUERY_PLACEHOLDER__';
const boardPathParam = 'boardPath';
const coduxBoardId = 'virtual:codux/board';
const coduxBoardSetupBeforeId = 'virtual:codux/board-setup/before';
const coduxBoardSetupAfterId = 'virtual:codux/board-setup/after';
const coduxClientModuleId = 'virtual:codux-client';
const htmlCoduxClientModuleEntryPoint = '/entry--' + coduxClientModuleId;
const coduxClientModule = readFileSync(
    path.resolve(path.resolve(import.meta.dirname, '../client'), 'index.js'),
    'utf-8',
);
const coduxHtmlModuleId = '_codux-board-render';
const coduxEntryHtml = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Codux Board</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="${htmlCoduxClientModuleEntryPoint}?${queryPlaceholder}"></script>
    </body>
</html>
`;
const coduxBadRequestHtml = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Codux Board</title>
    </head>
    <body>
      <p>boardPath is not provided</p>
    </body>
</html>
`;

export default function coduxBoardPlugin(): PluginOption {
    let resolvedConfig: ResolvedConfig | undefined = undefined;
    return {
        name: 'vite-plugin-react-codux-board',
        enforce: 'pre',
        apply(_config, env) {
            return env.mode === 'development';
        },
        configResolved(_resolvedConfig) {
            resolvedConfig = _resolvedConfig;
        },
        resolveId(requestedId, source) {
            const { specifier, query } = splitId(requestedId);

            if (specifier === htmlCoduxClientModuleEntryPoint && query !== undefined) {
                return `${coduxClientModuleId}?${query}`;
            }

            if (requestedId === coduxBoardSetupBeforeId) {
                const root = resolvedConfig?.root || process.cwd();
                const setupConfig = readBoardSetupFromCoduxConfig(
                    path.join(root, coduxConfigFileName),
                    resolvedConfig?.logger,
                );

                if (setupConfig.setupBefore) {
                    return path.resolve(resolvedConfig?.root || process.cwd(), setupConfig.setupBefore);
                }

                return noopId;
            }

            if (requestedId === coduxBoardSetupAfterId) {
                const root = resolvedConfig?.root || process.cwd();
                const setupConfig = readBoardSetupFromCoduxConfig(
                    path.join(root, coduxConfigFileName),
                    resolvedConfig?.logger,
                );

                if (setupConfig.setupAfter) {
                    return path.resolve(resolvedConfig?.root || process.cwd(), setupConfig.setupAfter);
                }

                return noopId;
            }

            if (requestedId === coduxBoardSetupAfterId) {
                return requestedId;
            }

            if (requestedId === coduxBoardId && source) {
                const { query } = splitId(source);
                if (query) {
                    const params = new URLSearchParams(query);
                    const boardPath = params.get(boardPathParam);
                    if (boardPath) {
                        return path.resolve(resolvedConfig?.root || process.cwd(), boardPath);
                    }
                }
            }

            return;
        },
        load(resolvedId) {
            const { specifier } = splitId(resolvedId);

            if (specifier === coduxClientModuleId) {
                return coduxClientModule;
            }
            if (specifier === noopId) {
                return '';
            }

            return;
        },

        configureServer: (server) => {
            const { middlewares, transformIndexHtml } = server;

            middlewares.use((req, res, next) => {
                if (res.writableEnded) {
                    return next();
                }

                const url = (req as { url: string }).url;
                const parsedUrl = new URL(url, 'http://localhost');
                if (parsedUrl.pathname === '/' + coduxHtmlModuleId) {
                    const boardPath = parsedUrl.searchParams.get(boardPathParam) ?? '';

                    if (boardPath) {
                        transformIndexHtml(
                            url,
                            coduxEntryHtml.replace(queryPlaceholder, `${boardPathParam}=${boardPath}`),
                            req.originalUrl,
                        )
                            .then((output) => {
                                res.setHeader('Content-Type', 'text/html');
                                res.statusCode = 200;
                                res.end(output);
                            })
                            .catch((error: Error) => {
                                next(error);
                            });
                    } else {
                        res.statusCode = 400;
                        res.end(coduxBadRequestHtml);
                    }
                } else {
                    next();
                }
            });
        },

        handleHotUpdate({ file, server }) {
            if (file.endsWith(coduxConfigFileName)) {
                // eslint-disable-next-line no-console
                console.log(`🦆 Resetting cache because ${file} changed.`);
                server.moduleGraph.invalidateAll();
                server.ws.send({
                    type: 'full-reload',
                    path: '*',
                });

                return [];
            }
            return;
        },
    };
}
