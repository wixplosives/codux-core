import React from 'react';
import { createSimulation } from '../src';

export const mockComponent: React.FC<any> = (props: { text: string }) => <div>{props.text}</div>;

export const propsOnlySimulation = createSimulation({
    componentType: mockComponent,
    name: 'mock simulation',
    props: {
        text: 'this is a test'
    }
});

export const overrideProps = {
    text: 'override text'
};

export const simulationWithWrapper = createSimulation({
    componentType: mockComponent,
    name: 'mock simulation',
    props: {
        text: 'this is a test'
    },
    wrapper: ({ renderSimulation }) => {
        return renderSimulation(overrideProps);
    }
});

export const simulationWithEnvironmentProps = createSimulation({
    componentType: mockComponent,
    name: 'mock simulation',
    props: {
        text: 'this is a test'
    },
    environmentProps: {
        canvasWidth: 50,
        canvasHeight: 100,
        canvasPadding: { left: 20, right: 10, top: 5, bottom: 2 },
        canvasMargin: { left: 210, right: 110, top: 51, bottom: 21 },
        canvasBackgroundColor: 'red',
        windowWidth: 500,
        windowHeight: 600,
        windowBackgroundColor: 'blue'
    }
});
