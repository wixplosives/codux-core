import { expect } from 'chai';
import { createDisposables } from '@wixc3/create-disposables';
import { createBoard } from '@wixc3/react-board';
import { setupBoardStage } from '../src/setup-stage';

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

        const { canvas, cleanup, updateCanvas, updateWindow } = setupBoardStage(
            createBoard({
                name: 'Test1',
                Board: () => null,
            }),
            container,
        );

        disposables.add(cleanup);

        return { canvas, container, updateWindow, updateCanvas };
    }

    it('renders the canvas into a parent element', () => {
        const { canvas, container } = setupBoard();

        expect(canvas.parentElement, 'canvas was not rendered into a provided container').to.eql(container);
    });

    it('sets canvas height and canvas width to the provided values if no margin is provided', () => {
        const { updateCanvas, canvas } = setupBoard();

        const canvasWidth = 420;
        const canvasHeight = 690;

        updateCanvas({
            canvasWidth,
            canvasHeight,
        });

        expect(canvas.offsetWidth, 'canvas width was not updated').equal(canvasWidth);
        expect(canvas.offsetHeight, 'canvas height was not updated').equal(canvasHeight);
    });

    it('sets canvas height to auto if a "top" and "bottom" margin is provided', () => {
        const { updateCanvas, canvas } = setupBoard();

        updateCanvas({ canvasHeight: 5, canvasMargin: { top: 5, bottom: 5 } });

        expect(canvas?.offsetHeight, 'canvas height is not stretched when margins are applied').equal(
            CONTAINER_HEIGHT - 2 * 5,
        );
    });

    it('sets canvas width to auto if "left" and "right" margin is provided', () => {
        const { updateCanvas, canvas } = setupBoard();

        updateCanvas({ canvasWidth: 5, canvasMargin: { left: 5, right: 5 } });

        expect(canvas?.offsetWidth, 'canvas width is not stretched when margins are applied').equal(
            window.innerWidth - 2 * 5,
        );
    });

    it('sets canvas background color', () => {
        const { updateCanvas, canvas } = setupBoard();

        updateCanvas({ canvasBackgroundColor: '#fff' });

        expect(window.getComputedStyle(canvas).backgroundColor, 'canvas background color was not updated').equal(
            'rgb(255, 255, 255)',
        );
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
