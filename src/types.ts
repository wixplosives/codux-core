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

export interface ISimulation<P> {
    /** The simulated component type. */
    componentType: React.ComponentType<P>;

    /** The name of the simulation. */
    name: string;

    /**
     * A map between a component property name and its simulated value.
     */
    // TODO - change props to be optional field (props?: ...)
    props: {
        [propName in keyof P]?: P[propName];
    };

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
}
