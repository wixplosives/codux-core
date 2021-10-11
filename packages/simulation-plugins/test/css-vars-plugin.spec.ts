import { expect } from 'chai';
import story from './fixtures/css-vars-user.story';

describe('css var plugin', () => {
    const cleanupAfterTest = new Set<() => unknown>();
    afterEach(() => {
        for (const cleanup of cleanupAfterTest) {
            cleanup();
        }
        cleanupAfterTest.clear();
    });

    it('wraps the simulation with context', () => {
        const { canvas, cleanup } = story.setupStage();
        cleanupAfterTest.add(cleanup);
        story.renderer(canvas);
        const compElement = canvas.children[0];
        const style = window.getComputedStyle(compElement);
        expect(style.color).to.equal('rgb(255, 0, 0)');
        cleanup();
        cleanupAfterTest.delete(cleanup);

        expect(document.getElementById('simulation-canvas')).to.equal(null);
    });
});
