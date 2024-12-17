import { expect } from 'chai';
import { createDisposables } from '@wixc3/create-disposables';
import board from './fixtures/context-user.board.js';

describe('react context plugin', () => {
    const disposables = createDisposables();
    afterEach(disposables.dispose);

    it('wraps the board with context', async () => {
        const { canvas, cleanup } = board.setupStage();
        disposables.add(cleanup);
        const cleanupRender = await board.render(canvas);
        disposables.add(cleanupRender);

        expect(canvas.innerText).to.include('context text');
    });
});
