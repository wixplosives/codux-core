import React from 'react';

export type LayoutSize = number | null;

export type LayoutSizeWithAuto = LayoutSize | 'auto';

export interface LayoutSpacing {
    left: LayoutSize;
    right: LayoutSize;
    top: LayoutSize;
    bottom: LayoutSize;
}

export type IPreviewEnvironmentPropsBase = IWindowEnvironmentProps & ICanvasEnvironmentProps;

export interface IWindowEnvironmentProps {
    windowWidth: number;
    windowHeight: number;
    windowBackgroundColor: string;
}

export interface ICanvasEnvironmentProps {
    canvasWidth: LayoutSizeWithAuto;
    canvasHeight: LayoutSizeWithAuto;
    canvasBackgroundColor: string;
    canvasMargin: LayoutSpacing;
    canvasPadding: LayoutSpacing;
}

export interface ISimulationWrapperProps<P> {
    /**
     * Call this function to render the simulated component with the simulated props.
     * @param overrides Allows you to override some of the simulated props with custom values.
     */
    renderSimulation: (overrides?: Partial<P>) => React.ReactElement<P>;
}

export interface ISetupController {
    addScript(scriptUrl: string): Promise<void>;
    addStylesheet(stylesheetUrl: string): Promise<void>;
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

export type CanvasStyles = Pick<
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

export type SetupSimulationStage = (
    simulation: ISimulation<Record<string, any>>
) => { canvas: HTMLElement; cleanup: () => void };

export type RenderSimulation = (
    simulation: ISimulation<Record<string, any>>
) => { canvas: HTMLElement; cleanup: () => void };

export type SimulationToJsx = (simulation: ISimulation<Record<string, any>>) => JSX.Element;
