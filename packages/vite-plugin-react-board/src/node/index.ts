import { readFileSync } from 'fs';
import path from 'path';
import type { PluginOption, ResolvedConfig } from 'vite';
import { readBoardSetupFromCoduxConfig } from './utils/utils.js';

const coduxBoardSetupId = 'virtual:codux/board-setup';
const coduxClientModuleId = 'virtual:codux-client';
const htmlCoduxClientModuleEntryPoint = '/entry--' + coduxClientModuleId;
const coduxClientModule = readFileSync(path.join(path.resolve(import.meta.dirname, '../client'), 'index.js'), 'utf-8');
const coduxHtmlModuleId = '_codux-board-render';
const coduxEntryHtml = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Boards</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="${htmlCoduxClientModuleEntryPoint}"></script>
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
        resolveId(requestedId) {
            if (requestedId === htmlCoduxClientModuleEntryPoint) {
                return coduxClientModuleId;
            }

            if (requestedId === coduxBoardSetupId) {
                return requestedId;
            }

            return;
        },
        load(resolvedId) {
            if (resolvedId === coduxClientModuleId) {
                return coduxClientModule;
            }

            if (resolvedId === coduxBoardSetupId) {
                return `export default ${JSON.stringify(
                    readBoardSetupFromCoduxConfig(
                        path.join(process.cwd(), 'codux.config.json'),
                        resolvedConfig?.logger,
                    ),
                )}`;
            }

            return;
        },

        configureServer: (server) => {
            const { config, middlewares, transformIndexHtml } = server;

            middlewares.use((req, res, next) => {
                if (res.writableEnded) {
                    return next();
                }

                const url = (req as { url: string }).url;
                const parsedUrl = new URL(url, 'http://localhost');
                if (parsedUrl.pathname === '/' + coduxHtmlModuleId) {
                    Object.entries(config?.server?.headers || {}).forEach(([key, value]) => {
                        res.setHeader(key, value!);
                    });
                    res.setHeader('Content-Type', 'text/html');
                    transformIndexHtml(url, coduxEntryHtml, req.originalUrl)
                        .then((output) => {
                            res.statusCode = 200;
                            res.end(output);
                        })
                        .catch((error: Error) => {
                            next(error);
                        });
                } else {
                    next();
                }
            });
        },
    };
}
