import { expect } from 'chai';
import story from './fixtures/context-user.story';

describe('react context plugin', () => {
    const cleanupAfterTest = new Set<() => unknown>();
    afterEach(() => {
        for (const cleanup of cleanupAfterTest) {
            cleanup();
        }
        cleanupAfterTest.clear();
    });

    it('wraps the story with context', () => {
        const { canvas, cleanup } = story.setupStage();
        cleanupAfterTest.add(cleanup);
        story.render(canvas);

        expect(canvas.innerText).to.include('context text');
        cleanup();
        cleanupAfterTest.delete(cleanup);

        expect(document.getElementById('simulation-canvas')).to.equal(null);
    });
});
