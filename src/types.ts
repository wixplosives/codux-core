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



export interface ISetupController {
    addScript(scriptUrl: string): Promise<void>;
    addStylesheet(stylesheetUrl: string): Promise<void>;
}

export type SimulationSetupFunction = (controller: ISetupController) => void | Promise<void>;

export interface Plugin<PluginProps, TARGET extends IGeneralMetaData<any, any>> {
    pluginName: string;
    defaultProps: Partial<PluginProps>;
    plugin: TARGET['__hooks'];
    use: (props: Partial<PluginProps>) => PluginInfo<this>
}
export interface PluginInfo<SYMB extends Plugin<any, any>> {
    key: SYMB,
    props: Partial<SYMB['defaultProps']>
}

export const createPlugin = <TARGET extends IGeneralMetaData<any, any> = IGeneralMetaData<any, any>>() =>
    <PluginProps>(pluginName: string, defaultProps: Partial<PluginProps>, plugin: TARGET['__hooks']) => {
        const res: Plugin<PluginProps, TARGET> = {
            pluginName,
            defaultProps,
            plugin,
            use: (props) => {
                return {
                    key: res,
                    props: { ...defaultProps, ...props }
                }
            }
        };
        return res
    }



export interface IGeneralMetaData<TARGET, hooks extends {} = {}> {
    target: TARGET,
    plugins?: PluginInfo<Plugin<any, this>>[],
    __hooks?: hooks
}


export interface IRenderableHooks {
    beforeAppendCanvas?(canvas: HTMLElement): void;
    beforeStageCleanUp?(canvas: HTMLElement): void;
}
export interface IRenderableMetaDataBase<HOOKS extends {} = {}> extends IGeneralMetaData<any, HOOKS & IRenderableHooks> {
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

export interface Simulation<ComponentType, PROPS, HOOKS> extends IRenderableMetaDataBase<HOOKS> {
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
