import { expect } from 'chai';
import { ViteDevServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Browser, BrowserContext, chromium, Page } from 'playwright-core';
import { createViteServer } from '../test-kit/index.js';

describe('codux vite plugin', function () {
    describe('dev server', function () {
        let server: ViteDevServer;
        let port: number;

        before(async function () {
            const testProjectPath = path.join(
                path.dirname(fileURLToPath(import.meta.resolve('@wixc3/vite-plugin-react-board/package.json'))),
                'test-kit/fixtures/vite-test-project',
            );

            const { server: viteServer, port: vitePort } = await createViteServer(testProjectPath);

            server = viteServer;
            port = vitePort;
        });

        after(async function () {
            if (server) {
                await server.waitForRequestsIdle();

                await server.close();
            }
        });

        it('serves board html entrypoint', async () => {
            const response = await fetch(`http://localhost:${port}/_codux-board-render`);
            const text = await response.text();
            expect(text, 'board entry html does not contain js entry for board').to.contain(
                '<script type="module" src="/entry--virtual:codux-client"></script>',
            );
        });

        it('serves board js entrypoint', async () => {
            const response = await fetch(`http://localhost:${port}/entry--virtual:codux-client`);
            const text = await response.text();
            expect(text).not.eq('');
            expect(text).not.eq(undefined);
            expect(response.status, 'js board entry is not served by the server').to.eql(200);
            expect(response.headers.get('content-type'), 'request did not resolve to javascript').to.eql(
                'text/javascript',
            );
        });

        describe('in browser', function () {
            let browser: Browser;
            let context: BrowserContext;
            let page: Page;

            before(async function () {
                browser = await chromium.launch({ headless: true });
                context = await browser.newContext();
                page = await context.newPage();
            });
            after(async function () {
                await page.close();
                await context.close();
                await browser.close();
            });

            it('renders board', async () => {
                await page.goto(
                    `http://localhost:${port}/_codux-board-render?boardPath=src/_codux/boards/test.board.tsx`,
                );

                const content = await page.textContent('h1');

                expect(content).to.eq('test board');
            });
        });
    });
});
