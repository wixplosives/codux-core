import { readFileSync } from 'fs';
import path from 'path';
import type { PluginOption } from 'vite';
import { readBoardSetupFromCoduxConfig } from './utils/utils';

const coduxBoardSetupId = 'virtual:codux/board-setup.js';
const coduxClientModuleId = 'virtual:codux/client.js';
const coduxClientModule = readFileSync(path.join(import.meta.dirname, 'client.js'), 'utf-8');
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
        <script type="module" src="/${coduxClientModuleId}"></script>
    </body>
</html>
`;

export default function coduxBoardPlugin(): PluginOption {
    return {
        name: 'vite-codux-board',
        enforce: 'pre',
        resolveId(requestedId) {
            if (requestedId === `/${coduxClientModuleId}`) {
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
                    readBoardSetupFromCoduxConfig(path.join(process.cwd(), 'codux.config.json')),
                )}`;
            }

            return;
        },

        configureServer: (server) => {
            const { config, middlewares, transformIndexHtml } = server;

            middlewares.use(async (req, res, next) => {
                if (res.writableEnded) {
                    return next();
                }

                const url = (req as any).url as string;
                const parsedUrl = new URL(url, 'http://localhost');
                if (parsedUrl.pathname === '/' + coduxHtmlModuleId) {
                    try {
                        Object.entries(config?.server?.headers || {}).forEach(([key, value]) => {
                            res.setHeader(key, value!);
                        });
                        res.setHeader('Content-Type', 'text/html');
                        res.statusCode = 200;

                        return res.end(await transformIndexHtml(url, coduxEntryHtml, req.originalUrl));
                    } catch (e) {
                        return next(e);
                    }
                }
                return next();
            });
        },
    };
}
