import ReactTestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import { simulationToJSX, renderSimulation, setupSimulationStage } from '../src';
import CheckboxWithWrapper from '../test-fixtures/checkbox-with-wrapper.sim';
import { CheckboxDriver } from '../test-fixtures/checkbox.driver';
import {
    propsOnlySimulation,
    simulationWithWrapper,
    simulationWithEnvironmentProps
} from '../test-fixtures/simulation-fixtures';

describe('Rendering Simulations', () => {
    describe('simulationToJSX', () => {
        it('renders a props-only simulation', () => {
            const renderedComponent = simulationToJSX(propsOnlySimulation);

            expect(ReactTestUtils.isElement(renderedComponent)).to.equal(true);
            expect(renderedComponent.props).to.eql(propsOnlySimulation.props);
        });

        it('renders a simulation with a wrapper', () => {
            const renderedComponent = simulationToJSX(simulationWithWrapper);

            expect(ReactTestUtils.isElement(renderedComponent)).to.equal(true);
            expect(renderedComponent).to.not.eql(propsOnlySimulation.props);
        });
    });

    describe('setupSimulationStage', () => {
        it('returns a canvas with the correct environment properties, and then unmounts it', () => {
            const { canvas, cleanup } = setupSimulationStage(simulationWithEnvironmentProps);

            expect(document.querySelector('[data-id="simulation-canvas"]')).to.not.equal(null);

            expect(canvas.style.height).to.equal(`${simulationWithEnvironmentProps.environmentProps?.canvasHeight}px`);
            expect(canvas.style.width).to.equal(`${simulationWithEnvironmentProps.environmentProps?.canvasWidth}px`);
            expect(canvas.style.backgroundColor).to.equal(
                simulationWithEnvironmentProps.environmentProps?.canvasBackgroundColor
            );
            expect(canvas.style.margin).to.equal(
                `${simulationWithEnvironmentProps.environmentProps?.canvasMargin?.top}px ${simulationWithEnvironmentProps.environmentProps?.canvasMargin?.right}px ${simulationWithEnvironmentProps.environmentProps?.canvasMargin?.bottom}px ${simulationWithEnvironmentProps.environmentProps?.canvasMargin?.left}px`
            );
            expect(canvas.style.padding).to.equal(
                `${simulationWithEnvironmentProps.environmentProps?.canvasPadding?.top}px ${simulationWithEnvironmentProps.environmentProps?.canvasPadding?.right}px ${simulationWithEnvironmentProps.environmentProps?.canvasPadding?.bottom}px ${simulationWithEnvironmentProps.environmentProps?.canvasPadding?.left}px`
            );

            cleanup();

            expect(document.getElementById('simulation-canvas')).to.equal(null);
        });

        it('styles the window properly, and then resets it', () => {
            const originalWindowWidth = window.outerWidth;
            const originalWindowHeight = window.outerHeight;
            const originalBodyColor = document.body.style.backgroundColor;

            const { cleanup } = setupSimulationStage(simulationWithEnvironmentProps);

            expect(window.outerWidth).to.equal(simulationWithEnvironmentProps.environmentProps?.windowWidth);
            expect(window.outerHeight).to.equal(simulationWithEnvironmentProps.environmentProps?.windowHeight);
            expect(document.body.style.backgroundColor).to.equal(
                simulationWithEnvironmentProps.environmentProps?.windowBackgroundColor
            );

            cleanup();

            expect(window.outerWidth).to.equal(originalWindowWidth);
            expect(window.outerHeight).to.equal(originalWindowHeight);
            expect(document.body.style.backgroundColor).to.equal(originalBodyColor);
        });
    });

    describe('an example test using the render helpers', () => {
        it('a Checkbox component can be toggled', () => {
            const { cleanup } = renderSimulation(CheckboxWithWrapper);

            const checkbox = new CheckboxDriver(
                document.getElementById(CheckboxWithWrapper.props.id) as HTMLInputElement
            );

            expect(checkbox.isChecked()).equal(false);
            checkbox.toggle();
            expect(checkbox.isChecked()).equal(true);

            cleanup();
        });
    });
});
