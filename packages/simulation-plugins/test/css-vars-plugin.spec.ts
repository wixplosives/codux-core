import { expect } from 'chai';
import demo from './fixtures/css-vars-user.demo';

describe('css var plugin', () => {
    const cleanupAfterTest = new Set<() => unknown>();
    afterEach(() => {
        for (const cleanup of cleanupAfterTest) {
            cleanup();
        }
        cleanupAfterTest.clear();
    });

    it('wraps the simulation with context', async () => {
        const { canvas, cleanup } = demo.setupStage();
        cleanupAfterTest.add(cleanup);
        await demo.render(canvas);
        const compElement = canvas.children[0];
        const style = window.getComputedStyle(compElement);
        expect(style.color).to.equal('rgb(255, 0, 0)');
        cleanup();
        cleanupAfterTest.delete(cleanup);

        expect(document.getElementById('simulation-canvas')).to.equal(null);
    });
});
