import { callHooks } from './hooks';
import type { SetupSimulationStage, IWindowEnvironmentProps } from './types';

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

export const setupSimulationStage: SetupSimulationStage = (simulation, parentElement) => {
    const canvas = document.createElement('div');
    canvas.setAttribute('id', 'simulation-canvas');

    const { environmentProps } = simulation;
    const resetWindow = applyStylesToWindow(environmentProps);

    callHooks(simulation, 'beforeAppendCanvas', canvas);

    parentElement.appendChild(canvas);

    const cleanup = () => {
        callHooks(simulation, 'beforeStageCleanUp', canvas);

        canvas.remove();
        resetWindow();
    };

    return { canvas, cleanup };
};
