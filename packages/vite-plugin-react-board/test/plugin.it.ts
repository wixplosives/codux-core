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

    it('runs boardGlobalSetup:before', async () => {
        let beforeHasBeenSeen = false;
        page.on('console', (msg) => {
            if (msg.text() === 'console-message-from-global-setup-before') {
                beforeHasBeenSeen = true;
            }
        });
        await page.goto(`http://localhost:${port()}/_codux-board-render?boardPath=src/_codux/boards/test.board.tsx`);
        await waitFor(() => expect(beforeHasBeenSeen).to.equal(true));
    });

    it('runs boardGlobalSetup:after', async () => {
        let afterHasBeenSeen = false;
        page.on('console', (msg) => {
            if (msg.text() === 'console-message-from-global-setup-after') {
                afterHasBeenSeen = true;
            }
        });
        await page.goto(`http://localhost:${port()}/_codux-board-render?boardPath=src/_codux/boards/test.board.tsx`);
        await waitFor(() => expect(afterHasBeenSeen).to.equal(true));
    });

    it('evaluates board-global-setup before and after in order', async () => {
        let beforeHasBeenSeen = false;
        let boardHasBeenSeen = false;
        let afterHasBeenSeen = false;
        page.on('console', (msg) => {
            if (msg.text() === 'console-message-from-global-setup-before') {
                beforeHasBeenSeen = true;
                expect(boardHasBeenSeen).to.equal(false);
                expect(afterHasBeenSeen).to.equal(false);
            }

            if (msg.text() === 'console-message-from-board') {
                expect(beforeHasBeenSeen).to.equal(true);
                boardHasBeenSeen = true;
                expect(afterHasBeenSeen).to.equal(false);
            }
            if (msg.text() === 'console-message-from-global-setup-after') {
                expect(beforeHasBeenSeen).to.equal(true);
                expect(boardHasBeenSeen).to.equal(true);
                afterHasBeenSeen = true;
            }
        });
        await page.goto(`http://localhost:${port()}/_codux-board-render?boardPath=src/_codux/boards/test.board.tsx`);
        await waitFor(() => expect(afterHasBeenSeen).to.equal(true));
    });

    it('handles missing boardPath query param', async () => {
        await page.goto(`http://localhost:${port()}/_codux-board-render`);
        const content = await page.textContent('body');
        expect(content).to.contain('boardPath is not provided');
    });
});
