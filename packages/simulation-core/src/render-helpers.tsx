import type {
    SetupSimulationStage,
    RenderSimulation,
    IWindowEnvironmentProps,
    ICanvasEnvironmentProps,
    IGeneralMetadata,
    PluginInfo,
    Plugin,
    HookMap,
    IPROPS,
    HOOK,
} from './types';

// const entries = Object.entries as <T>(o: T) => [Extract<keyof T, string>, T[keyof T]][];

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

const applyStylesToWindow = (windowStyles: Partial<IWindowEnvironmentProps> = {}) => {
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

const mapEnvironmentPropsToStyles = (environmentProps: Partial<ICanvasEnvironmentProps>): CanvasStyles => ({
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

const applyStylesToCanvas = (canvas: HTMLDivElement, canvasEnvironmentProps: Partial<ICanvasEnvironmentProps> = {}) => {
    Object.assign(canvas.style, mapEnvironmentPropsToStyles(canvasEnvironmentProps));
};
export type HookNames<DATA extends IGeneralMetadata<unknown, HookMap>> = keyof NonNullable<DATA['__hooks']> & string;

export function getPluginsWithHooks<DATA extends IGeneralMetadata<unknown, HookMap>>(
    data: DATA,
    hookName: HookNames<DATA>
): PluginInfo<IPROPS, DATA, Plugin<IPROPS, DATA>>[] {
    if (!data.plugins) {
        return [];
    }
    return data.plugins.filter((item) => !!(item.key.plugin as HookMap)[hookName]) as PluginInfo<
        IPROPS,
        DATA,
        Plugin<IPROPS, DATA>
    >[];
}

export type HookParams<DATA extends IGeneralMetadata<unknown, HookMap>, HOOK extends HookNames<DATA>> = NonNullable<
    NonNullable<DATA['__hooks']>[HOOK]
> extends (pluginParams: never, ...args: infer U) => void | unknown
    ? U
    : never;

export function callHooks<DATA extends IGeneralMetadata<unknown, HookMap>, HOOKNAME extends HookNames<DATA>>(
    data: DATA,
    hookName: HOOKNAME,
    ...props: HookParams<DATA, HOOKNAME>
): void {
    const plugins = getPluginsWithHooks(data, hookName);
    for (const pluginInfo of plugins) {
        if ((pluginInfo.key.plugin as HookMap)[hookName]) {
            (((pluginInfo.key.plugin as HookMap)[hookName] as unknown) as HOOK<
                IPROPS,
                HookParams<DATA, HOOKNAME>,
                void
            >)(pluginInfo.props as never, ...props);
        }
    }
}

export const setupSimulationStage: SetupSimulationStage = (simulation) => {
    const canvas = document.createElement('div');
    canvas.setAttribute('id', 'simulation-canvas');

    const resetWindow = applyStylesToWindow(simulation.environmentProps);
    applyStylesToCanvas(canvas, simulation.environmentProps);
    callHooks(simulation, 'beforeAppendCanvas', canvas);

    document.body.appendChild(canvas);

    const cleanup = () => {
        callHooks(simulation, 'beforeStageCleanUp', canvas);

        canvas.remove();
        resetWindow();
    };

    return { canvas, cleanup };
};

export const renderSimulation: RenderSimulation = (simulation) => {
    const { canvas, cleanup: stageCleanup } = setupSimulationStage(simulation);
    simulation.renderer(canvas);

    return {
        canvas,
        cleanup: (): void => {
            simulation.cleanup(canvas);
            stageCleanup();
        },
    };
};
