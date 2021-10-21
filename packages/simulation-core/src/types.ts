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

export type HOOK<PLUGINPARAMS, HOOKPARAMS extends unknown[], RES> = (
    params: PLUGINPARAMS,
    ...hookParams: HOOKPARAMS
) => RES;

export interface HookMap<PLUGINPARAMS = never> {
    [hookName: string]: HOOK<PLUGINPARAMS, never[], unknown> | undefined;
}

export interface ISetupController {
    addScript(scriptUrl: string): Promise<void>;
    addStylesheet(stylesheetUrl: string): Promise<void>;
}

export type SimulationSetupFunction = (controller: ISetupController) => void | Promise<void>;

export interface Plugin<PLUGINPARAMS, TARGET extends IGeneralMetadata<HookMap>> {
    pluginName: string;
    defaultProps: Partial<PLUGINPARAMS>;
    plugin: TARGET['__hooks'];
    use: (props: PLUGINPARAMS) => PluginInfo<PLUGINPARAMS, TARGET, Plugin<PLUGINPARAMS, TARGET>>;
    /** for  use in WCS */
    merge: (pluginProps: PLUGINPARAMS[]) => PLUGINPARAMS[];
}

export interface PluginInfo<
    PLUGINPARAMS,
    TARGET extends IGeneralMetadata<HookMap>,
    SYMB extends Plugin<PLUGINPARAMS, TARGET>
> {
    key: SYMB;
    props: PLUGINPARAMS;
}

export type ReplaceParams<MAP extends HookMap, PARAMS> = {
    [hookname in keyof MAP]: NonNullable<MAP[hookname]> extends (
        pProps: never,
        ...params: infer HOOKPARAMS
    ) => infer RES
        ? HOOK<PARAMS, HOOKPARAMS, RES>
        : never;
};
export const defaultMerge = <T>(props: T[]): T[] => [
    props.reduceRight((acc, curr) => {
        return { ...acc, ...curr };
    }),
];
export const createPlugin =
    <TARGET extends IGeneralMetadata<HookMap> = IGeneralMetadata<HookMap>>() =>
    <PluginProps>(
        pluginName: string,
        defaultProps: Partial<PluginProps>,
        plugin: ReplaceParams<NonNullable<TARGET['__hooks']>, PluginProps>,
        merge: (params: PluginProps[]) => PluginProps[] = defaultMerge
    ): Plugin<PluginProps, TARGET> => {
        const res: Plugin<PluginProps, TARGET> = {
            pluginName,
            defaultProps,
            plugin,
            use: (props) => {
                return {
                    key: res as unknown as Plugin<PluginProps, TARGET>,
                    props: { ...defaultProps, ...props } as PluginProps,
                };
            },
            merge,
        };
        return res;
    };

/** Describe entities in your project. */
export interface IGeneralMetadata<HOOKS extends HookMap = HookMap> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins?: PluginInfo<unknown, this, Plugin<any, this>>[];
    __hooks?: HOOKS;
}

export interface IRenderableLifeCycleHooks<PLUGINPARAMS = never> extends HookMap<PLUGINPARAMS> {
    beforeAppendCanvas?(props: PLUGINPARAMS, canvas: HTMLElement): void;
    beforeStageCleanUp?(props: PLUGINPARAMS, canvas: HTMLElement): void;
    beforeRender?(pluginProps: PLUGINPARAMS, canvas: HTMLElement): void;
    afterRender?(props: PLUGINPARAMS, canvas: HTMLElement): void;
}

export interface IRenderableMetadataBase<HOOKS extends HookMap = HookMap>
    extends IGeneralMetadata<HOOKS & IRenderableLifeCycleHooks> {
    /**
     * renders the Renderable into an html element
     */
    render: (targetElement: HTMLElement) => Promise<void>;
    /**
     * cleans everything render does
     */
    cleanup: (targetElement: HTMLElement) => void;
    /**
     * sets the stage for the renderer.
     * this function has many side effects ( such as effecting window styles and sizes )
     *
     * @returns canvas an html element for rendering into, cleanup a method for cleaing up the sideeffects
     *
     */
    setupStage: () => { canvas: HTMLElement; cleanup: () => void };

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

/**
 * A single appearance of a component.
 */
export interface ISimulation<ComponentType, P, HOOKS extends HookMap = HookMap> extends IRenderableMetadataBase<HOOKS> {
    /** The simulated component type. */
    componentType: ComponentType;

    /** The name of the simulation. */
    name: string;

    /**
     * A map between a component property name and its simulated value.
     */
    props: P;
}

export type SetupSimulationStage = (simulation: IRenderableMetadataBase) => {
    canvas: HTMLElement;
    cleanup: () => void;
};
