import { callHooks } from './hooks';
import type { SetupSimulationStage, IWindowEnvironmentProps, ICanvasEnvironmentProps, CanvasStyles } from './types';

export const defaultWindowStyles = {
    width: 1024,
    height: 640,
    backgroundColor: '#fcfcfc',
} as const;

export const defaultCanvasStyles: CanvasStyles = {
    width: 'fit-content',
    height: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 'auto',
    marginTop: 'auto',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingTop: '0px',
    backgroundColor: '#fff',
} as const;

export const defaultEnvironmentProperties = {
    windowWidth: defaultWindowStyles.width,
    windowHeight: defaultWindowStyles.height,
    windowBackgroundColor: defaultWindowStyles.backgroundColor,
    canvasMargin: {},
    canvasPadding: {},
    canvasBackgroundColor: defaultCanvasStyles.backgroundColor,
};

const applyStylesToWindow = (windowStyles: IWindowEnvironmentProps = {}, previousProps: IWindowEnvironmentProps) => {
    // we revert the changes to previous values when running cleanup
    previousProps.windowHeight = previousProps.windowHeight ? window.outerHeight : defaultWindowStyles.height;
    previousProps.windowWidth = previousProps.windowWidth ? window.outerWidth : defaultWindowStyles.width;
    previousProps.windowBackgroundColor = previousProps.windowBackgroundColor
        ? document.body.style.backgroundColor
        : defaultWindowStyles.backgroundColor;

    window.resizeTo(
        windowStyles.windowWidth || previousProps.windowWidth,
        windowStyles.windowHeight || previousProps.windowHeight
    );

    document.body.style.backgroundColor = windowStyles.windowBackgroundColor || previousProps.windowBackgroundColor;
};

const applyStylesToCanvas = (canvas: HTMLDivElement, environmentProps: ICanvasEnvironmentProps = {}) => {
    const canvasStyle = {
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
    };

    // Canvas gets stretched horizontally/vertically
    // when vertical (top and bottom) or horizontal (left and right) margins are applied.
    if (environmentProps.canvasMargin?.left !== undefined && environmentProps.canvasMargin.right !== undefined) {
        canvasStyle.width = '100%';
    }

    if (environmentProps.canvasMargin?.top !== undefined && environmentProps.canvasMargin.bottom !== undefined) {
        canvasStyle.height = 'auto';
    }

    Object.assign(canvas.style, canvasStyle);
};

export const setupSimulationStage: SetupSimulationStage = (simulation, parentElement) => {
    const previousWindowEnvironmentProps: IWindowEnvironmentProps = {};
    const canvas = document.createElement('div');
    canvas.setAttribute('id', 'simulation-canvas');

    const { environmentProps } = simulation;

    applyStylesToWindow(environmentProps, previousWindowEnvironmentProps);
    applyStylesToCanvas(canvas, environmentProps);

    callHooks(simulation, 'beforeAppendCanvas', canvas);

    parentElement.appendChild(canvas);

    const updateCanvas = (canvasEnvironmentProps: ICanvasEnvironmentProps) => {
        applyStylesToCanvas(canvas, canvasEnvironmentProps);
    };

    const updateWindow = (windowEnvironmentProps: IWindowEnvironmentProps) => {
        applyStylesToWindow(windowEnvironmentProps, previousWindowEnvironmentProps);
    };

    const cleanup = () => {
        callHooks(simulation, 'beforeStageCleanUp', canvas);
        canvas.remove();

        if (previousWindowEnvironmentProps.windowWidth && previousWindowEnvironmentProps.windowHeight) {
            window.resizeTo(previousWindowEnvironmentProps.windowWidth, previousWindowEnvironmentProps.windowHeight);
        }

        if (previousWindowEnvironmentProps.windowBackgroundColor) {
            document.body.style.backgroundColor = previousWindowEnvironmentProps.windowBackgroundColor;
        }
    };

    return { canvas, updateCanvas, updateWindow, cleanup };
};
