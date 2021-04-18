/* eslint-disable @typescript-eslint/no-explicit-any */
export type LayoutSize = number | undefined | null;

export type LayoutSizeWithAuto = LayoutSize | 'auto';

export interface LayoutSpacing {
    /** @visualizer spacing */
    top?: LayoutSize;
    /** @visualizer spacing */
    right?: LayoutSize;
    /** @visualizer spacing */
    bottom?: LayoutSize;
    /** @visualizer spacing */
    left?: LayoutSize;
}

export type IPreviewEnvironmentPropsBase = IWindowEnvironmentProps & ICanvasEnvironmentProps;

export interface IWindowEnvironmentProps {
    /** @visualizer spacing */
    windowWidth?: number | undefined;
    /** @visualizer spacing */
    windowHeight?: number | undefined;
    /** @visualizer color */
    windowBackgroundColor?: string | undefined;
}

export interface ICanvasEnvironmentProps {
    /** @visualizer spacing */
    canvasWidth?: LayoutSizeWithAuto;
    /** @visualizer spacing */
    canvasHeight?: LayoutSizeWithAuto;
    /** @visualizer color */
    canvasBackgroundColor?: string;
    /** @visualizer canvasMargin */
    canvasMargin?: LayoutSpacing;
    /** @visualizer canvasPadding */
    canvasPadding?: LayoutSpacing;
}

export interface IPROPS {
    [propName: string]: unknown
}

export type HOOK<PLUGINPARAMS extends IPROPS, HOOKPARAMS extends unknown[], RES> = (params: PLUGINPARAMS, ...hookParams: HOOKPARAMS) => RES
export interface HookMap<PLUGINPARAMS extends IPROPS = never> {
    [hookName: string]: HOOK<PLUGINPARAMS, never[], unknown> | undefined
}



export interface ISetupController {
    addScript(scriptUrl: string): Promise<void>;
    addStylesheet(stylesheetUrl: string): Promise<void>;
}

export type SimulationSetupFunction = (controller: ISetupController) => void | Promise<void>;

export interface Plugin<PLUGINPARAMS extends IPROPS, TARGET extends IGeneralMetaData<unknown, HookMap>> {
    pluginName: string;
    defaultProps: Partial<PLUGINPARAMS>;
    plugin: TARGET['__hooks'];
    use: (props: Partial<PLUGINPARAMS>) => PluginInfo<PLUGINPARAMS, TARGET, Plugin<PLUGINPARAMS, TARGET>>
}
export interface PluginInfo<PLUGINPARAMS extends IPROPS, TARGET extends IGeneralMetaData<unknown, HookMap>, SYMB extends Plugin<PLUGINPARAMS, TARGET>> {
    key: SYMB,
    props: PLUGINPARAMS
}

export type ReplaceParams<MAP extends HookMap, PARAMS extends IPROPS> = {
    [hookname in keyof MAP]: NonNullable<MAP[hookname]> extends (pProps: never, ...params: infer HOOKPARAMS) => infer RES ? HOOK<PARAMS, HOOKPARAMS, RES> : never
}


export const createPlugin = <TARGET extends IGeneralMetaData<unknown, HookMap> = IGeneralMetaData<unknown, HookMap>>() =>
    <PluginProps extends IPROPS>(pluginName: string, defaultProps: Partial<PluginProps>, plugin: ReplaceParams<NonNullable<TARGET['__hooks']>, PluginProps>): Plugin<PluginProps, TARGET> => {
        const res: Plugin<PluginProps, TARGET> = {
            pluginName,
            defaultProps,
            plugin,
            use: (props) => {
                return {
                    key: res as unknown as Plugin<PluginProps, TARGET>,
                    props: { ...defaultProps, ...props } as PluginProps
                }
            }
        };
        return res
    }

export interface IGeneralMetaData<TARGET, HOOKS extends HookMap = HookMap> {
    target: TARGET,
    plugins?: PluginInfo<IPROPS, this, Plugin<any, this>>[],
    __hooks?: HOOKS
}


export interface IRenderableHooks<PLUGINPARAMS extends IPROPS = never> extends HookMap<PLUGINPARAMS> {
    beforeAppendCanvas?(props: PLUGINPARAMS, canvas: HTMLElement): void;
    beforeStageCleanUp?(props: PLUGINPARAMS, canvas: HTMLElement): void;
    beforeRender?(pluginProps: PLUGINPARAMS, canvas: HTMLElement): void;
    afterRender?(props: PLUGINPARAMS, canvas: HTMLElement): void;
}
export interface IRenderableMetaDataBase<HOOKS extends HookMap = HookMap> extends IGeneralMetaData<unknown, HOOKS & IRenderableHooks> {
    /**
     * renders the Renderable into an html element
     */
    renderer: (targetElement: HTMLElement) => void;
    /**
     * cleans everything the renderer does
     */
    cleanup: (targetElement: HTMLElement) => void;
    /**
     * sets the stage for the renderer.
     * this function has many side effects ( such as effecting window styles and sizes )
     * 
     * @returns canvas an html element for rendering into, cleanup a method for cleaing up the sideeffects
     *
     */
    setupStage: () => { canvas: HTMLElement, cleanup: () => void };



    /**
     * Simulation's environment properties (e.g. the window size, the component alignment, etc.)
     */
    environmentProps?: IPreviewEnvironmentPropsBase;
    /**
    * Functions for setting up the page for the simulation: adding global styles,
    * scripts, etc. These functions run only once before the simulation is mounted.
    */
    setup?: SimulationSetupFunction | SimulationSetupFunction[];

}

export interface ISimulation<ComponentType, PROPS, HOOKS extends HookMap = HookMap> extends IRenderableMetaDataBase<HOOKS> {
    /** The simulated component type. */
    componentType: ComponentType;

    /** The name of the simulation. */
    name: string;

    /**
     * A map between a component property name and its simulated value.
     */
    // TODO - change props to be optional field (props?: ...)
    props: PROPS;

}


export type SetupSimulationStage = (simulation: IRenderableMetaDataBase) => { canvas: HTMLElement; cleanup: () => void };
export type RenderSimulation = (simulation: IRenderableMetaDataBase) => { canvas: HTMLElement; cleanup: () => void };
