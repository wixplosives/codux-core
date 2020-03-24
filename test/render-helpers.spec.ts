import ReactTestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import { simulationToJsx, renderSimulation, setupSimulationStage } from '../src';
import CheckboxWithWrapper from './fixtures/checkbox-with-wrapper.sim';
import { CheckboxDriver } from './fixtures/checkbox.driver';
import {
    propsOnlySimulation,
    simulationWithWrapper,
    simulationWithEnvironmentProps
} from './fixtures/simulation-fixtures';

describe('Rendering Simulations', () => {
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
            const environmentProps = simulationWithEnvironmentProps.environmentProps;
            const canvasMargin = environmentProps?.canvasMargin;
            const canvasPadding = environmentProps?.canvasPadding;

            expect(document.getElementById('simulation-canvas')?.parentElement).to.equal(document.body);

            expect(canvas.style.height).to.equal(`${environmentProps?.canvasHeight}px`);
            expect(canvas.style.width).to.equal(`${environmentProps?.canvasWidth}px`);
            expect(canvas.style.backgroundColor).to.equal(environmentProps?.canvasBackgroundColor);
            expect(canvas.style.margin).to.equal(
                `${canvasMargin?.top}px ${canvasMargin?.right}px ${canvasMargin?.bottom}px ${canvasMargin?.left}px`
            );
            expect(canvas.style.padding).to.equal(
                `${canvasPadding?.top}px ${canvasPadding?.right}px ${canvasPadding?.bottom}px ${canvasPadding?.left}px`
            );

            cleanup();

            expect(document.getElementById('simulation-canvas')).to.equal(null);
        });

        it('styles the window properly, and then resets it', () => {
            const originalWindowWidth = window.outerWidth;
            const originalWindowHeight = window.outerHeight;
            const originalBodyColor = document.body.style.backgroundColor;

            const environmentProps = simulationWithEnvironmentProps.environmentProps;

            const { cleanup } = setupSimulationStage(simulationWithEnvironmentProps);

            expect(window.outerWidth).to.equal(environmentProps?.windowWidth);
            expect(window.outerHeight).to.equal(environmentProps?.windowHeight);
            expect(document.body.style.backgroundColor).to.equal(environmentProps?.windowBackgroundColor);

            cleanup();

            expect(window.outerWidth).to.equal(originalWindowWidth);
            expect(window.outerHeight).to.equal(originalWindowHeight);
            expect(document.body.style.backgroundColor).to.equal(originalBodyColor);
        });
    });

    describe('an example test using the render helpers', () => {
        it('a Checkbox component can be toggled', () => {
            const { canvas, cleanup } = renderSimulation(CheckboxWithWrapper);

            const checkbox = new CheckboxDriver(canvas.children[0] as HTMLInputElement);

            expect(checkbox.isChecked()).equal(false);
            checkbox.toggle();
            expect(checkbox.isChecked()).equal(true);

            cleanup();
        });
    });
});
