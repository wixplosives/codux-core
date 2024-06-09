import { expect } from 'chai';
import { createDisposables } from '@wixc3/create-disposables';
import { IReactBoard, createBoard } from '@wixc3/react-board';
import { setupBoardStage } from '../src/setup-stage';

describe('setupBoardStage', () => {
    const disposables = createDisposables();
    afterEach(disposables.dispose);

    const CONTAINER_HEIGHT = 50;

    function setupBoard(board: Partial<IReactBoard> = {}) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.height = `${CONTAINER_HEIGHT}px`;
        document.body.appendChild(container);
        disposables.add(() => {
            if (container.parentElement === document.body) {
                document.body.removeChild(container);
            }
        });

        const { canvas, cleanup, updateCanvas, updateWindow } = setupBoardStage(
            createBoard({
                name: 'Test1',
                Board: () => null,
                ...board,
            }),
            container,
        );

        disposables.add(cleanup);

        return { canvas, container, updateWindow, updateCanvas };
    }

    it('renders the canvas into a parent element', () => {
        const { canvas, container } = setupBoard({
            environmentProps: {},
        });

        expect(canvas.parentElement, 'canvas was not rendered into a provided container').to.eql(container);
    });

    it('sets canvas height and canvas width to the provided values if no margin is provided', () => {
        const { updateCanvas } = setupBoard();

        const width = 420;
        const height = 690;

        const canvas = updateCanvas({
            width,
            height,
        });

        expect(canvas.offsetWidth, 'canvas width was not updated').equal(width);
        expect(canvas.offsetHeight, 'canvas height was not updated').equal(height);
    });

    it('sets canvas height to auto if a "top" and "bottom" margin is provided', () => {
        const { updateCanvas } = setupBoard();

        const canvas = updateCanvas({ height: 5, margin: { top: 5, bottom: 5 }, backgroundColor: 'red' });

        expect(canvas?.offsetHeight, 'canvas height is not stretched when margins are applied').equal(
            CONTAINER_HEIGHT - 2 * 5,
        );
    });

    it('sets canvas width to auto if "left" and "right" margin is provided', () => {
        const { updateCanvas } = setupBoard();

        const canvas = updateCanvas({ width: 5, margin: { left: 5, right: 5 } });

        expect(canvas?.offsetWidth, 'canvas width is not stretched when margins are applied').equal(
            window.innerWidth - 2 * 5,
        );
    });

    it('sets canvas background color', () => {
        const { updateCanvas } = setupBoard();

        const canvas = updateCanvas({
            backgroundColor: '#fff',
        });

        expect(window.getComputedStyle(canvas).backgroundColor, 'canvas background color was not updated').equal(
            'rgb(255, 255, 255)',
        );
    });
    it('toggles canvas off and then on', () => {
        const { updateCanvas, canvas: startCanvas } = setupBoard({
            canvas: {
                backgroundColor: 'red',
            },
        });

        updateCanvas(undefined);

        expect(startCanvas.isConnected, 'canvas was not removed').to.equal(false);

        const newCanvas = updateCanvas({
            backgroundColor: 'red',
        });

        expect(newCanvas.isConnected, 'new canvas was not connected').to.equal(true);
    });
    it('sets window dimensions', () => {
        const { updateWindow } = setupBoard();

        updateWindow({ height: 500, width: 500 });

        expect(window.outerHeight, 'window height was not updated').to.eql(500);
        expect(window.outerWidth, 'window width was not updated').to.eql(500);
    });

    it('sets window background color', () => {
        const { updateWindow } = setupBoard();

        updateWindow({ backgroundColor: '#fff' });

        expect(window.getComputedStyle(document.body).backgroundColor, 'window background color was not updated').equal(
            'rgb(255, 255, 255)',
        );
    });
});
