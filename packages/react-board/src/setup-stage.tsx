import type {
    CanvasStyles,
    ICanvasEnvironmentProps,
    IPreviewEnvironmentPropsBase,
    IWindowEnvironmentProps,
} from '@wixc3/board-core';
import type { BoardSetupStageFunction } from './types';

export const defaultWindowStyles = {
    width: 1024,
    height: 640,
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
} as const;

export const defaultEnvironmentProperties: IPreviewEnvironmentPropsBase = {
    windowWidth: defaultWindowStyles.width,
    windowHeight: defaultWindowStyles.height,
    canvasMargin: {},
    canvasPadding: {},
};

export const defaultWindowProperties: IWindowEnvironmentProps = {
    height: defaultWindowStyles.height,
    width: defaultWindowStyles.width,
};

export const defaultCanvasProperties: ICanvasEnvironmentProps = {};

const applyStylesToWindow = (windowStyles: IWindowEnvironmentProps = {}, previousProps: IWindowEnvironmentProps) => {
    // we revert the changes to previous values when running cleanup
    previousProps.height = previousProps.height ? window.outerHeight : defaultWindowStyles.height;
    previousProps.width = previousProps.width ? window.outerWidth : defaultWindowStyles.width;

    window.resizeTo(windowStyles.width || previousProps.width, windowStyles.width || previousProps.width);

    document.body.style.backgroundColor = windowStyles.backgroundColor || '';
};

const applyStylesToCanvas = (canvas: HTMLElement, environmentProps: ICanvasEnvironmentProps = {}) => {
    const canvasStyle = {
        width: environmentProps.width !== undefined ? `${environmentProps.width}px` : defaultCanvasStyles.width,
        height: environmentProps.height !== undefined ? `${environmentProps.height}px` : defaultCanvasStyles.height,
        marginLeft:
            environmentProps.margin?.left !== undefined
                ? `${environmentProps.margin?.left}px`
                : defaultCanvasStyles.marginLeft,
        marginRight:
            environmentProps.margin?.right !== undefined
                ? `${environmentProps.margin?.right}px`
                : defaultCanvasStyles.marginRight,
        marginBottom:
            environmentProps.margin?.bottom !== undefined
                ? `${environmentProps.margin?.bottom}px`
                : defaultCanvasStyles.marginBottom,
        marginTop:
            environmentProps.margin?.top !== undefined
                ? `${environmentProps.margin?.top}px`
                : defaultCanvasStyles.marginTop,
        paddingLeft:
            environmentProps.padding?.left !== undefined
                ? `${environmentProps.padding?.left}px`
                : defaultCanvasStyles.paddingLeft,
        paddingRight:
            environmentProps.padding?.right !== undefined
                ? `${environmentProps.padding?.right}px`
                : defaultCanvasStyles.paddingRight,
        paddingBottom:
            environmentProps.padding?.bottom !== undefined
                ? `${environmentProps.padding?.bottom}px`
                : defaultCanvasStyles.paddingBottom,
        paddingTop:
            environmentProps.padding?.top !== undefined
                ? `${environmentProps.padding?.top}px`
                : defaultCanvasStyles.paddingTop,
        backgroundColor: environmentProps.backgroundColor || '',
    };

    // Canvas gets stretched horizontally/vertically
    // when horizontal (left and right) or vertical (top and bottom) margins are applied.
    if (environmentProps.margin?.left !== undefined && environmentProps.margin.right !== undefined) {
        canvasStyle.width = '100%';
    }

    if (environmentProps.margin?.top !== undefined && environmentProps.margin.bottom !== undefined) {
        canvasStyle.height = 'auto';
    }

    Object.assign(canvas.style, canvasStyle);
};

function createContainer() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    document.body.appendChild(container);
    return container;
}
export const setupBoardStage: BoardSetupStageFunction = (board, parentElement = createContainer()) => {
    const previousWindowEnvironmentProps: IWindowEnvironmentProps = {};

    const { environmentProps, canvas: canvasProps, window: windowProps } = board;

    let usedWindowProps = windowProps;
    let usedCanvasProps = canvasProps;
    if (environmentProps) {
        // old behavior, canvas is always rendered
        usedWindowProps = {
            backgroundColor: environmentProps.windowBackgroundColor,
            height: environmentProps.windowHeight,
            width: environmentProps.windowWidth,
        };
        usedCanvasProps = {
            backgroundColor: environmentProps.canvasBackgroundColor,
            height: environmentProps.canvasHeight,
            width: environmentProps.canvasWidth,
            padding: environmentProps.canvasPadding,
            margin: environmentProps.canvasMargin,
        };
    }
    applyStylesToWindow(usedWindowProps, previousWindowEnvironmentProps);
    const updateWindow = (windowEnvironmentProps: IWindowEnvironmentProps) => {
        applyStylesToWindow(windowEnvironmentProps, previousWindowEnvironmentProps);
    };
    const cleanupWindow = () => {
        if (previousWindowEnvironmentProps.width && previousWindowEnvironmentProps.height) {
            window.resizeTo(previousWindowEnvironmentProps.height, previousWindowEnvironmentProps.height);
        }
    };
    function createCanvas(canvasProps: ICanvasEnvironmentProps) {
        const canvasEl = document.createElement('div');
        canvasEl.setAttribute('id', 'board-canvas');
        applyStylesToCanvas(canvasEl, canvasProps);
        parentElement.appendChild(canvasEl);

        return canvasEl;
    }
    let canvasElement: HTMLElement | undefined;
    if (usedCanvasProps) {
        canvasElement = createCanvas(usedCanvasProps);
    }
    const updateCanvas = (canvasEnvironmentProps?: ICanvasEnvironmentProps) => {
        if (canvasEnvironmentProps) {
            if (!canvasElement) {
                canvasElement = createCanvas(canvasEnvironmentProps);
            } else {
                applyStylesToCanvas(canvasElement, canvasEnvironmentProps);
            }
        } else {
            if (canvasElement && canvasElement.parentElement === parentElement) {
                canvasElement.remove();
                canvasElement = undefined;
            }
        }
        return canvasElement || parentElement;
    };

    return {
        canvas: canvasElement || parentElement,
        updateCanvas,
        cleanup() {
            cleanupWindow();
            if (canvasElement) {
                canvasElement.remove();
            }
        },
        updateWindow,
    };
};
