import React from 'react';
import ReactDOM from 'react-dom';
import type {
    SetupSimulationStage,
    RenderSimulation,
    SimulationToJsx,
    IWindowEnvironmentProps,
    ICanvasEnvironmentProps,
} from './types';

type CanvasStyles = Pick<
    CSSStyleDeclaration,
    | 'backgroundColor'
    | 'height'
    | 'width'
    | 'paddingLeft'
    | 'paddingRight'
    | 'paddingBottom'
    | 'paddingTop'
    | 'marginLeft'
    | 'marginRight'
    | 'marginBottom'
    | 'marginTop'
>;

const defaultCanvasStyles: CanvasStyles = {
    width: 'fit-content',
    height: 'fit-content',
    marginLeft: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginTop: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingTop: '0px',
    backgroundColor: '#fff',
};

const applyStylesToWindow = (windowStyles: IWindowEnvironmentProps = {}) => {
    const oldWindowHeight = window.outerHeight;
    const oldWindowWidth = window.outerWidth;
    const oldBackgroundColor = document.body.style.backgroundColor;

    window.resizeTo(windowStyles.windowWidth || oldWindowWidth, windowStyles.windowHeight || oldWindowHeight);
    document.body.style.backgroundColor = windowStyles.windowBackgroundColor || oldBackgroundColor;

    return () => {
        window.resizeTo(oldWindowWidth, oldWindowHeight);
        document.body.style.backgroundColor = oldBackgroundColor;
    };
};

const calculateCanvasStyle = (environmentProps: ICanvasEnvironmentProps = {}): CanvasStyles => ({
    width: environmentProps.canvasWidth ? `${environmentProps.canvasWidth}px` : defaultCanvasStyles.width,
    height: environmentProps.canvasHeight ? `${environmentProps.canvasHeight}px` : defaultCanvasStyles.height,
    marginLeft: environmentProps.canvasMargin?.left
        ? `${environmentProps.canvasMargin?.left}px`
        : defaultCanvasStyles.marginLeft,
    marginRight: environmentProps.canvasMargin?.right
        ? `${environmentProps.canvasMargin?.right}px`
        : defaultCanvasStyles.marginRight,
    marginBottom: environmentProps.canvasMargin?.bottom
        ? `${environmentProps.canvasMargin?.bottom}px`
        : defaultCanvasStyles.marginBottom,
    marginTop: environmentProps.canvasMargin?.top
        ? `${environmentProps.canvasMargin?.top}px`
        : defaultCanvasStyles.marginTop,
    paddingLeft: environmentProps.canvasPadding?.left
        ? `${environmentProps.canvasPadding?.left}px`
        : defaultCanvasStyles.paddingLeft,
    paddingRight: environmentProps.canvasPadding?.right
        ? `${environmentProps.canvasPadding?.right}px`
        : defaultCanvasStyles.paddingRight,
    paddingBottom: environmentProps.canvasPadding?.bottom
        ? `${environmentProps.canvasPadding?.bottom}px`
        : defaultCanvasStyles.paddingBottom,
    paddingTop: environmentProps.canvasPadding?.top
        ? `${environmentProps.canvasPadding?.top}px`
        : defaultCanvasStyles.paddingTop,
    backgroundColor: environmentProps.canvasBackgroundColor || defaultCanvasStyles.backgroundColor,
});

export const simulationToJsx: SimulationToJsx = (simulation) => {
    const { componentType: Comp, props = {}, wrapper: Wrapper } = simulation;

    const renderWithPropOverrides = (overrides?: Record<string, unknown>) => <Comp {...props} {...overrides} />;

    return Wrapper ? <Wrapper renderSimulation={renderWithPropOverrides} /> : <Comp {...props} />;
};

export const setupSimulationStage: SetupSimulationStage = (simulation) => {
    const canvas = document.createElement('div');
    canvas.setAttribute('id', 'simulation-canvas');

    const resetWindow = applyStylesToWindow(simulation.environmentProps);
    Object.assign(canvas.style, calculateCanvasStyle(simulation.environmentProps));

    document.body.appendChild(canvas);

    const cleanup = () => {
        canvas.remove();
        resetWindow();
    };

    return { canvas: canvas, cleanup };
};

export const renderSimulation: RenderSimulation = (simulation) => {
    const { canvas, cleanup: stageCleanup } = setupSimulationStage(simulation);
    const Comp = simulationToJsx(simulation);

    ReactDOM.render(Comp, canvas);

    return {
        canvas,
        cleanup: (): void => {
            ReactDOM.unmountComponentAtNode(canvas);
            stageCleanup();
        },
    };
};
