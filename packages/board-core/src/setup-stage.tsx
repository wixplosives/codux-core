import { callHooks } from './hooks';
import type { BoardSetupStageFunction, IWindowEnvironmentProps } from './types';

export const defaultWindowStyles = {
    width: 1024,
    height: 640,
} as const;

export const defaultEnvironmentProperties = {
    windowWidth: defaultWindowStyles.width,
    windowHeight: defaultWindowStyles.height,
};

const applyStylesToWindow = (windowStyles: IWindowEnvironmentProps = {}, previousProps: IWindowEnvironmentProps) => {
    // we revert the changes to previous values when running cleanup
    previousProps.windowHeight = previousProps.windowHeight ? window.outerHeight : defaultWindowStyles.height;
    previousProps.windowWidth = previousProps.windowWidth ? window.outerWidth : defaultWindowStyles.width;

    window.resizeTo(
        windowStyles.windowWidth || previousProps.windowWidth,
        windowStyles.windowHeight || previousProps.windowHeight,
    );

    document.body.style.backgroundColor = windowStyles.windowBackgroundColor || '';
};

export const setupBoardStage: BoardSetupStageFunction = (board, parentElement) => {
    const previousWindowEnvironmentProps: IWindowEnvironmentProps = {};
    const canvas = document.createElement('div');
    callHooks(board, 'beforeAppendCanvas', canvas);

    parentElement.appendChild(canvas);

    canvas.setAttribute('id', 'board-canvas');

    const { environmentProps } = board;

    const updateWindow = (windowEnvironmentProps: IWindowEnvironmentProps) => {
        applyStylesToWindow(windowEnvironmentProps, previousWindowEnvironmentProps);
    };

    applyStylesToWindow(environmentProps, previousWindowEnvironmentProps);

    const cleanup = () => {
        callHooks(board, 'beforeStageCleanUp', canvas);
        canvas.remove();

        if (previousWindowEnvironmentProps.windowWidth && previousWindowEnvironmentProps.windowHeight) {
            window.resizeTo(previousWindowEnvironmentProps.windowWidth, previousWindowEnvironmentProps.windowHeight);
        }
    };

    // backward compatibility with older versions
    //  of Codux that still use updateCanvas
    function updateCanvas() {
        return;
    }

    return { canvas, updateWindow, updateCanvas, cleanup };
};
