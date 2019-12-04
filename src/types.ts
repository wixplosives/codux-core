import React from 'react';

export interface ISimulationProps {
    [propName: string]: any;
}

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
     * Simulation's environment settings (e.g. the window size, the component alignment, etc.).
     * The specific type definition is out of scope of this spec.
     */
    environmentProps?: Partial<IPreviewEnvironmentPropsBase>;
}
