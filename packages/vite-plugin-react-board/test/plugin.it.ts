import { expect } from 'chai';
import { Browser, BrowserContext, chromium, Page } from 'playwright-core';
import { setupViteServerForFixture } from './utils.js';
import { waitFor } from 'promise-assist';

describe('Codux vite plugin — in browser', function () {
    const port = setupViteServerForFixture('vite-test-project');

    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    beforeEach(async function () {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext();
        page = await context.newPage();
    });

    afterEach(async function () {
        await page.close();
        await context.close();
        await browser.close();
    });

    it('renders board', async () => {
        await page.goto(`http://localhost:${port()}/_codux-board-render?boardPath=src/_codux/boards/test.board.tsx`);

        const content = await page.textContent('h1');

        expect(content).to.eq('test board');
    });

    it('before', async () => {
        let beforeHasBeenSeen = false;
        page.on('console', (msg) => {
            if (msg.text() === 'console-message-from-global-setup-before') {
                beforeHasBeenSeen = true;
            }
        });
        await page.goto(`http://localhost:${port()}/_codux-board-render?boardPath=src/_codux/boards/test.board.tsx`);
        await waitFor(() => expect(beforeHasBeenSeen).to.be.true);
    });

    it('after', async () => {
        let afterHasBeenSeen = false;
        page.on('console', (msg) => {
            if (msg.text() === 'console-message-from-global-setup-after') {
                afterHasBeenSeen = true;
            }
        });
        await page.goto(`http://localhost:${port()}/_codux-board-render?boardPath=src/_codux/boards/test.board.tsx`);
        await waitFor(() => expect(afterHasBeenSeen).to.be.true);
    });

    it('board not found', async () => {
        await page.goto(`http://localhost:${port()}/_codux-board-render`);
        const content = await page.textContent('body');
        expect(content).to.contain('boardPath is not provided');
    });
});
