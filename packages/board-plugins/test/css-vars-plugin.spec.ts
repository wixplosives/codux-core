import { expect } from 'chai';
import board from './fixtures/css-vars-user.board.js';

describe('css var plugin', () => {
    const cleanupAfterTest = new Set<() => unknown>();
    afterEach(() => {
        for (const cleanup of cleanupAfterTest) {
            cleanup();
        }
        cleanupAfterTest.clear();
    });

    it('wraps the board with context', async () => {
        const { canvas, cleanup } = board.setupStage();
        cleanupAfterTest.add(cleanup);
        const cleanupRender = await board.render(canvas);
        cleanupAfterTest.add(cleanupRender);
        const compElement = canvas.children[0];
        const style = window.getComputedStyle(compElement);
        expect(style.color).to.equal('rgb(255, 0, 0)');
        cleanup();
        cleanupAfterTest.delete(cleanup);

        expect(document.getElementById('board-canvas')).to.equal(null);
    });
});
