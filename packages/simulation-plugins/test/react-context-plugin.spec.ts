import { expect } from 'chai';
import demo from './fixtures/context-user.demo';

describe('react context plugin', () => {
    const cleanupAfterTest = new Set<() => unknown>();
    afterEach(() => {
        for (const cleanup of cleanupAfterTest) {
            cleanup();
        }
        cleanupAfterTest.clear();
    });

    it('wraps the demo with context', async () => {
        const { canvas, cleanup } = demo.setupStage();
        cleanupAfterTest.add(cleanup);
        await demo.render(canvas);

        expect(canvas.innerText).to.include('context text');
        cleanup();
        cleanupAfterTest.delete(cleanup);

        expect(document.getElementById('simulation-canvas')).to.equal(null);
    });
});
