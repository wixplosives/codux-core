import React from 'react';

export type LayoutSize = number | null;

export type LayoutSizeWithAuto = LayoutSize | 'auto';

export interface LayoutSpacing {
    left: LayoutSize;
    right: LayoutSize;
    top: LayoutSize;
    bottom: LayoutSize;
}

export interface IPreviewEnvironmentPropsBase {
    canvasWidth: LayoutSizeWithAuto;
    canvasHeight: LayoutSizeWithAuto;
    canvasBackgroundColor: string;
    canvasMargin: LayoutSpacing;
    canvasPadding: LayoutSpacing;
    windowWidth: number;
    windowHeight: number;
    windowBackgroundColor: string;
}

export interface ISimulationWrapperProps<P> {
    /**
     * Call this function to render the simulated component with the simulated props.
     * @param overrides Allows you to override some of the simulated props with custom values.
     */
    renderSimulation: (overrides?: Partial<P>) => React.ReactElement<P>;
}

export interface ISetupController {
    addScript (scriptUrl: string) : Promise<void>;
    addStylesheet (stylesheetUrl: string) : Promise<void>;
}

export type SimulationSetupFunction = (controller: ISetupController) => Promise<void>;

export interface ISimulation<P> {
    /** The simulated component type. */
    componentType: React.ComponentType<P>;

    /** The name of the simulation. */
    name: string;

    /**
     * A map between a component property name and its simulated value.
     */
    // TODO - change props to be optional field (props?: ...)
    props: Partial<React.PropsWithChildren<P>>;

    /**
     * Simulation's environment settings (e.g. the window size, the component alignment, etc.)
     */
    environmentProps?: Partial<IPreviewEnvironmentPropsBase>;

    /**
     * Allows to wrap the simulated component in another component. Useful for providing context,
     * rendering controlled components, or rendering the simulated component multiple times - for
     * example a radio button as a radio group.
     */
    wrapper?: React.FunctionComponent<ISimulationWrapperProps<P>>;

    /**
     * Functions for setting up the page for the simulation: adding global styles,
     * scripts, etc. These functions run only once before the simulation is mounted.
     */
    setup?: SimulationSetupFunction | SimulationSetupFunction[];
}

export interface IHelperMethods {
    renderSimulation<P>(simulation: ISimulation<P>, options?: IRenderOptions): JSX.Element;
    renderIntoContainer<P>(simulation: ISimulation<P>, container: Element, options?: IRenderOptions, callback?: () => void): void
}

export interface IRenderOptions {
    shouldApplyEnvironmentProps?: boolean;
    shouldWrapComponent?: boolean;
    shouldRunSetup?: boolean;
    // Needs more discussion
}