import { expect } from 'chai';
import { createSimulation } from '@wixc3/react-simulation';
import { setupSimulationStage } from '@wixc3/simulation-core';

const CONTAINER_HEIGHT = 50;

describe('setup-stage', () => {
    const cleanupAfterTest = new Set<() => unknown>();
    afterEach(() => {
        for (const cleanup of cleanupAfterTest) {
            cleanup();
        }
        cleanupAfterTest.clear();
    });

    function setupSimulation() {
        const container = createCanvasContainer();

        const { canvas, cleanup, updateCanvas, updateWindow } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => null,
            }),
            container
        );

        cleanupAfterTest.add(cleanup);

        return { canvas, container, updateWindow, updateCanvas };
    }

    it('renders the canvas into a parent element', () => {
        const { canvas, container } = setupSimulation();
        expect(canvas.parentElement, 'canvas was not rendered into a provided container').to.eql(container);
    });

    it('sets canvas height and canvas width to the provided values if no margin is provided', () => {
        const { updateCanvas, canvas } = setupSimulation();

        const canvasSize = { canvasHeight: 690, canvasWidth: 420 };

        updateCanvas({
            canvasWidth: canvasSize.canvasWidth,
            canvasHeight: canvasSize.canvasHeight,
        });

        expect(canvas?.offsetHeight, 'canvas height was not updated').equal(canvasSize.canvasHeight);
        expect(canvas?.offsetWidth, 'canvas width was not updated').equal(canvasSize.canvasWidth);
    });

    it('sets canvas height to auto if a "top" and "bottom" margin is provided', () => {
        const { updateCanvas, canvas } = setupSimulation();

        updateCanvas({ canvasHeight: 5, canvasMargin: { top: 5, bottom: 5 } });

        expect(canvas?.offsetHeight, 'canvas height is not stretched when margins are applied').equal(
            CONTAINER_HEIGHT - 2 * 5
        );
    });

    it('sets canvas width to auto if "left" and "right" margin is provided', () => {
        const { updateCanvas, canvas } = setupSimulation();

        updateCanvas({ canvasWidth: 5, canvasMargin: { left: 5, right: 5 } });

        expect(canvas?.offsetWidth, 'canvas width is not stretched when margins are applied').equal(
            window.innerWidth - 2 * 5
        );
    });

    it('sets canvas background color', () => {
        const { updateCanvas, canvas } = setupSimulation();

        updateCanvas({ canvasBackgroundColor: '#fff' });

        expect(window.getComputedStyle(canvas).backgroundColor, 'canvas background color was not updated').equal(
            'rgb(255, 255, 255)'
        );
    });

    it('sets window dimensions', () => {
        const { updateWindow } = setupSimulation();

        updateWindow({ windowHeight: 500, windowWidth: 500 });

        expect(window.outerHeight, 'window height was not updated').to.eql(500);
        expect(window.outerWidth, 'window width was not updated').to.eql(500);
    });

    it('sets window background color', () => {
        const { updateWindow } = setupSimulation();

        updateWindow({ windowBackgroundColor: '#fff' });
        expect(window.getComputedStyle(document.body).backgroundColor, 'window background color was not updated').equal(
            'rgb(255, 255, 255)'
        );
    });
});

function createCanvasContainer() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.height = `${CONTAINER_HEIGHT}px`;
    document.body.appendChild(container);
    return container;
}
