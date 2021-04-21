import ReactTestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import { simulationToJsx, renderSimulation, setupSimulationStage } from '@wixc3/wcs-core';
import CheckboxWithWrapper from './fixtures/checkbox-with-wrapper.sim';
import { CheckboxDriver } from './fixtures/checkbox.driver';
import {
    propsOnlySimulation,
    simulationWithWrapper,
    simulationWithEnvironmentProps,
} from './fixtures/simulation-fixtures';

describe('Rendering Simulations', () => {
    const cleanupAfterTest = new Set<() => unknown>();
    afterEach(() => {
        for (const cleanup of cleanupAfterTest) {
            cleanup();
        }
        cleanupAfterTest.clear();
    });

    describe('simulationToJsx', () => {
        it('returns correct JSX for a props-only simulation', () => {
            const renderedComponent = simulationToJsx(propsOnlySimulation);

            expect(ReactTestUtils.isElement(renderedComponent)).to.equal(true);
            expect(renderedComponent.props).to.eql(propsOnlySimulation.props);
        });

        it('returns correct JSX for a simulation with a wrapper', () => {
            const renderedComponent = simulationToJsx(simulationWithWrapper);

            expect(ReactTestUtils.isElement(renderedComponent)).to.equal(true);
            expect(renderedComponent.type).to.eql(simulationWithWrapper.wrapper);
        });
    });

    describe('setupSimulationStage', () => {
        it('returns a canvas with the correct environment properties, and then unmounts it', () => {
            const { canvas, cleanup } = setupSimulationStage(simulationWithEnvironmentProps);
            cleanupAfterTest.add(cleanup);
            const { environmentProps } = simulationWithEnvironmentProps;
            const { canvasMargin, canvasPadding, canvasBackgroundColor, canvasHeight, canvasWidth } =
                environmentProps ?? {};

            expect(document.getElementById('simulation-canvas')?.parentElement).to.equal(document.body);

            expect(canvas.style.height).to.equal(`${canvasHeight as number}px`);
            expect(canvas.style.width).to.equal(`${canvasWidth as number}px`);
            expect(canvas.style.backgroundColor).to.equal(canvasBackgroundColor);
            expect(canvas.style.margin).to.equal(
                `${canvasMargin?.top as number}px ${canvasMargin?.right as number}px ${
                    canvasMargin?.bottom as number
                }px ${canvasMargin?.left as number}px`
            );
            expect(canvas.style.padding).to.equal(
                `${canvasPadding?.top as number}px ${canvasPadding?.right as number}px ${
                    canvasPadding?.bottom as number
                }px ${canvasPadding?.left as number}px`
            );

            cleanup();
            cleanupAfterTest.delete(cleanup);

            expect(document.getElementById('simulation-canvas')).to.equal(null);
        });

        it('styles the window properly, and then resets it', () => {
            const originalWindowWidth = window.outerWidth;
            const originalWindowHeight = window.outerHeight;
            const originalBodyColor = document.body.style.backgroundColor;

            const { environmentProps } = simulationWithEnvironmentProps;

            const { cleanup } = setupSimulationStage(simulationWithEnvironmentProps);
            cleanupAfterTest.add(cleanup);

            expect(window.outerWidth).to.equal(environmentProps?.windowWidth);
            expect(window.outerHeight).to.equal(environmentProps?.windowHeight);
            expect(document.body.style.backgroundColor).to.equal(environmentProps?.windowBackgroundColor);

            cleanup();
            cleanupAfterTest.delete(cleanup);

            expect(window.outerWidth).to.equal(originalWindowWidth);
            expect(window.outerHeight).to.equal(originalWindowHeight);
            expect(document.body.style.backgroundColor).to.equal(originalBodyColor);
        });
    });

    describe('an example test using the render helpers', () => {
        it('a Checkbox component can be toggled', () => {
            const { canvas, cleanup } = renderSimulation(CheckboxWithWrapper);
            cleanupAfterTest.add(cleanup);

            const checkbox = new CheckboxDriver(canvas.children[0] as HTMLInputElement);

            expect(checkbox.isChecked()).equal(false);
            checkbox.toggle();
            expect(checkbox.isChecked()).equal(true);
        });
    });
});
