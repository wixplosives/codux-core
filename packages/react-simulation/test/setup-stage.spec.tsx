import React from 'react';
import { expect } from 'chai';
import { createSimulation } from '@wixc3/react-simulation';
import { setupSimulationStage } from '@wixc3/simulation-core';

const CONTAINER_HEIGHT = 50;

describe('setup-stage', () => {
    it('renders canvas to parent element', () => {
        const container = createCanvasContainer();

        const { canvas } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => null,
            }),
            container
        );

        expect(canvas.parentElement).to.eql(container);
    });

    it('sets canvas height and canvas width to the provided values if no margin is provided', () => {
        const container = createCanvasContainer();

        const { canvas, updateCanvas } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => null,
            }),
            container
        );

        const canvasSize = { canvasHeight: 690, canvasWidth: 420 };
        updateCanvas({
            canvasWidth: canvasSize.canvasWidth,
            canvasHeight: canvasSize.canvasHeight,
        });

        expect(canvas?.offsetHeight).equal(canvasSize.canvasHeight);
        expect(canvas?.offsetWidth).equal(canvasSize.canvasWidth);
    });

    it('sets canvas height to auto if a top and bottom margin is provided', () => {
        const container = createCanvasContainer();

        const { canvas, updateCanvas } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => <>123</>,
            }),
            container
        );

        updateCanvas({ canvasHeight: 5, canvasMargin: { top: 5, bottom: 5 } });
        expect(canvas?.offsetHeight).equal(CONTAINER_HEIGHT - 2 * 5);
    });

    it('sets canvas width to auto if a left and right margin is provided', () => {
        const container = createCanvasContainer();

        const { canvas, updateCanvas } = setupSimulationStage(
            createSimulation({
                name: 'Test1',
                props: {},
                componentType: () => null,
            }),
            container
        );

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
