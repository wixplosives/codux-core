import React from 'react';
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

    it('renders the canvas into a parent element', () => {
        const container = createCanvasContainer();

        const { canvas, cleanup } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => null,
            }),
            container
        );

        cleanupAfterTest.add(cleanup);
        expect(canvas.parentElement).to.eql(container);
    });

    it('sets canvas height and canvas width to the provided values if no margin is provided', () => {
        const container = createCanvasContainer();

        const { canvas, updateCanvas, cleanup } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => null,
            }),
            container
        );
        cleanupAfterTest.add(cleanup);

        const canvasSize = { canvasHeight: 690, canvasWidth: 420 };

        updateCanvas({
            canvasWidth: canvasSize.canvasWidth,
            canvasHeight: canvasSize.canvasHeight,
        });

        expect(canvas?.offsetHeight).equal(canvasSize.canvasHeight);
        expect(canvas?.offsetWidth).equal(canvasSize.canvasWidth);
    });

    it('sets canvas height to auto if a "top" and "bottom" margin is provided', () => {
        const container = createCanvasContainer();

        const { canvas, cleanup, updateCanvas } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => <>123</>,
            }),
            container
        );
        cleanupAfterTest.add(cleanup);

        updateCanvas({ canvasHeight: 5, canvasMargin: { top: 5, bottom: 5 } });

        expect(canvas?.offsetHeight).equal(CONTAINER_HEIGHT - 2 * 5);
    });

    it('sets canvas width to auto if "left" and "right" margin is provided', () => {
        const container = createCanvasContainer();

        const { canvas, updateCanvas, cleanup } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => null,
            }),
            container
        );
        cleanupAfterTest.add(cleanup);

        updateCanvas({ canvasWidth: 5, canvasMargin: { left: 5, right: 5 } });

        expect(canvas?.offsetWidth).equal(window.innerWidth - 2 * 5);
    });
});

function createCanvasContainer() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.height = `${CONTAINER_HEIGHT}px`;
    document.body.appendChild(container);
    return container;
}
