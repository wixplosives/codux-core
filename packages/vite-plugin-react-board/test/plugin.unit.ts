import { expect } from 'chai';
import { setupViteServerForFixture } from './utils.js';

describe('Codux vite plugin — dev server', function () {
    const port = setupViteServerForFixture('vite-test-project');

    it('serves board html entrypoint', async () => {
        const response = await fetch(`http://localhost:${port()}/_codux-board-render?boardPath=test.board.ts`);
        const text = await response.text();
        expect(text, 'board entry html does not contain js entry for board').to.contain(
            '<script type="module" src="/entry--virtual:codux-client?boardPath=test.board.ts"></script>',
        );
    });

    it('serves board js entrypoint', async () => {
        const response = await fetch(`http://localhost:${port()}/entry--virtual:codux-client?boardPath=test.board.ts`);
        const text = await response.text();
        expect(text).not.eq('');
        expect(text).not.eq(undefined);
        expect(response.status, 'js board entry is not served by the server').to.eql(200);
        expect(response.headers.get('content-type'), 'request did not resolve to javascript').to.eql('text/javascript');
    });
});
