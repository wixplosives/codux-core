import { expect } from 'chai';
import board from './fixtures/context-user.board';

describe('react context plugin', () => {
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
        await board.render(canvas);

        expect(canvas.innerText).to.include('context text');
        cleanup();
        cleanupAfterTest.delete(cleanup);

        expect(document.getElementById('simulation-canvas')).to.equal(null);
    });
});
