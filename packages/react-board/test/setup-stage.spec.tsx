import { expect } from 'chai';
import { createDisposables } from '@wixc3/create-disposables';
import { createBoard } from '@wixc3/react-board';
import { setupBoardStage } from '@wixc3/board-core';

describe('setupBoardStage', () => {
    const disposables = createDisposables();
    afterEach(disposables.dispose);

    const CONTAINER_HEIGHT = 50;

    function setupBoard() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.height = `${CONTAINER_HEIGHT}px`;
        document.body.appendChild(container);
        disposables.add(() => document.body.removeChild(container));

        const { canvas, cleanup, updateWindow } = setupBoardStage(
            createBoard({
                name: 'Test1',
                Board: () => null,
            }),
            container,
        );

        disposables.add(cleanup);

        return { canvas, container, updateWindow };
    }

    it('renders the canvas into a parent element', () => {
        const { canvas, container } = setupBoard();

        expect(canvas.parentElement, 'canvas was not rendered into a provided container').to.eql(container);
    });

    it('sets window dimensions', () => {
        const { updateWindow } = setupBoard();

        updateWindow({ windowHeight: 500, windowWidth: 500 });

        expect(window.outerHeight, 'window height was not updated').to.eql(500);
        expect(window.outerWidth, 'window width was not updated').to.eql(500);
    });

    it('sets window background color', () => {
        const { updateWindow } = setupBoard();

        updateWindow({ windowBackgroundColor: '#fff' });

        expect(window.getComputedStyle(document.body).backgroundColor, 'window background color was not updated').equal(
            'rgb(255, 255, 255)',
        );
    });
});
