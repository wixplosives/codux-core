import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import { createSimulation, renderSimulation } from '../src';

const mockComponent = (props: { text: string }) => <div>{props.text}</div>;

const propsOnlySimulation = createSimulation({
    componentType: mockComponent,
    name: 'mock simulation',
    props: {
        text: 'this is a test'
    }
});

describe('Rendering Simulations', () => {
    describe('renderSimulation', () => {
        it('renders a props-only simulation', () => {
            const renderedComponent = renderSimulation(propsOnlySimulation);
            expect(ReactTestUtils.isElement(renderedComponent)).to.equal(true);
            // TODO: check that props are passed
        });

        it('renders a simulation with a wrapper', () => {
            //
        });
    });

    describe('renderIntoContainer', () => {
        it('renders into a container', () => {
            //
        });

        it('returns a cleanup method', () => {
            //
        });
    });
});
