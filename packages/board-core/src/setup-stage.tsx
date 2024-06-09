import type { IWindowEnvironmentProps, ICanvasEnvironmentProps, CanvasStyles } from './types';

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

export const defaultEnvironmentProperties = {
    windowWidth: defaultWindowStyles.width,
    windowHeight: defaultWindowStyles.height,
    canvasMargin: {},
    canvasPadding: {},
};

export const applyStylesToWindow = (
    windowStyles: IWindowEnvironmentProps = {},
    previousProps: IWindowEnvironmentProps,
) => {
    // we revert the changes to previous values when running cleanup
    previousProps.height = previousProps.height ? window.outerHeight : defaultWindowStyles.height;
    previousProps.width = previousProps.width ? window.outerWidth : defaultWindowStyles.width;

    window.resizeTo(windowStyles.width || previousProps.width, windowStyles.width || previousProps.width);

    document.body.style.backgroundColor = windowStyles.backgroundColor || '';
};

export const applyStylesToCanvas = (canvas: HTMLElement, environmentProps: ICanvasEnvironmentProps = {}) => {
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

export function createContainer() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    document.body.appendChild(container);
    return container;
}
