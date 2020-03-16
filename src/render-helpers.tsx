import React from 'react';
import ReactDOM from 'react-dom';
import {
    ISimulation,
    IPreviewEnvironmentPropsBase,
    SetupSimulationStage,
    RenderSimulation,
    SimulationToJsx
} from './types';
import { entries } from './typed-entries';

type canvasStyles = Pick<
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

type canvasEnvironmentProperties = Pick<
    IPreviewEnvironmentPropsBase,
    'canvasBackgroundColor' | 'canvasHeight' | 'canvasMargin' | 'canvasPadding' | 'canvasWidth'
>;

type windowEnvironmentProperties = Pick<
    IPreviewEnvironmentPropsBase,
    'windowHeight' | 'windowWidth' | 'windowBackgroundColor'
>;

const applyStylesToWindow = (windowStyles: Partial<windowEnvironmentProperties> = {}) => {
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

const mapEnvironmentPropsToStyles = (environmentProps: Partial<canvasEnvironmentProperties>): canvasStyles => {
    const defaultCanvasStyling: canvasStyles = {
        width: environmentProps.canvasWidth ? `${environmentProps.canvasWidth}px` : 'fit-content',
        height: environmentProps.canvasHeight ? `${environmentProps.canvasHeight}px` : 'fit-content',
        marginLeft: environmentProps.canvasMargin?.left ? `${environmentProps.canvasMargin?.left}px` : '0px',
        marginRight: environmentProps.canvasMargin?.right ? `${environmentProps.canvasMargin?.right}px` : '0px',
        marginBottom: environmentProps.canvasMargin?.bottom ? `${environmentProps.canvasMargin?.bottom}px` : '0px',
        marginTop: environmentProps.canvasMargin?.top ? `${environmentProps.canvasMargin?.top}px` : '0px',
        paddingLeft: environmentProps.canvasPadding?.left ? `${environmentProps.canvasPadding?.left}px` : '0px',
        paddingRight: environmentProps.canvasPadding?.right ? `${environmentProps.canvasPadding?.right}px` : '0px',
        paddingBottom: environmentProps.canvasPadding?.bottom ? `${environmentProps.canvasPadding?.bottom}px` : '0px',
        paddingTop: environmentProps.canvasPadding?.top ? `${environmentProps.canvasPadding?.top}px` : '0px',
        backgroundColor: environmentProps.canvasBackgroundColor || '#fff'
    };

    return defaultCanvasStyling;
};

const applyStylesToCanvas = (
    canvas: HTMLDivElement,
    canvasEnvironmentProps: Partial<canvasEnvironmentProperties> = {}
) => {
    const styles = mapEnvironmentPropsToStyles(canvasEnvironmentProps);

    for (const [styleProperty, stylePropertyValue] of entries(styles)) {
        canvas.style[styleProperty] = stylePropertyValue;
    }

    return canvas;
};

export const simulationToJSX: SimulationToJsx = simulation => {
    const { componentType: Comp, props = {}, wrapper: Wrapper } = simulation;

    const renderWithPropOverrides = (overrides?: Record<string, any>) => <Comp {...props} {...overrides} />;

    return Wrapper ? <Wrapper renderSimulation={renderWithPropOverrides} /> : <Comp {...props} />;
};

export const setupSimulationStage: SetupSimulationStage = simulation => {
    const canvas = document.createElement('div');
    canvas.setAttribute('data-id', 'simulation-canvas');

    const resetWindow = applyStylesToWindow(simulation.environmentProps);
    const styledCanvas = applyStylesToCanvas(canvas, simulation.environmentProps);

    document.body.appendChild(styledCanvas);

    const cleanup = () => {
        styledCanvas.remove();
        resetWindow();
    };

    return { canvas: styledCanvas, cleanup };
};

export const renderSimulation: RenderSimulation = simulation => {
    const { canvas, cleanup: stageCleanup } = setupSimulationStage(simulation);
    const Comp = simulationToJSX(simulation);

    ReactDOM.render(Comp, canvas);

    return {
        canvas,
        cleanup: () => {
            ReactDOM.unmountComponentAtNode(canvas);
            stageCleanup();
        }
    };
};
