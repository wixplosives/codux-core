import type React from 'react';
import type { IPreviewEnvironmentPropsBase, SimulationSetupFunction } from '@wixc3/simulation-core';
import type { ISimulationWrapperProps } from '@wixc3/react-simulation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ISimulation<P = any> {
    /** The simulated component type. */
    componentType: React.ComponentType<P>;

    /** The name of the simulation. */
    name: string;

    /**
     * A map between a component property name and its simulated value.
     */
    props: Partial<React.PropsWithChildren<P>>;

    /**
     * Simulation's environment properties (e.g. the window size, the component alignment, etc.)
     */
    environmentProps?: IPreviewEnvironmentPropsBase;

    /**
     * Allows to wrap the simulated component in another component. Useful for providing context,
     * rendering controlled components, or rendering the simulated component multiple times - for
     * example a radio button as a radio group.
     */
    wrapper?: React.ComponentType<ISimulationWrapperProps<P>>;

    /**
     * Functions for setting up the page for the simulation: adding global styles,
     * scripts, etc. These functions run only once before the simulation is mounted.
     */
    setup?: SimulationSetupFunction | SimulationSetupFunction[];
}

export type SetupSimulationStage = (simulation: ISimulation) => { canvas: HTMLElement; cleanup: () => void };
export type RenderSimulation = (simulation: ISimulation) => { canvas: HTMLElement; cleanup: () => void };
export type SimulationToJsx = (simulation: ISimulation) => JSX.Element;


/**
 *  Augmentation of react types and html attributes to store meta-information like visualizers
 *
 *  This is a toy example, it has to be changed before merging!
 *
 *  Actually we want to have 'image visualizer' for the image.src attribute but the image visualizer
 *  does not exist yet. For demonstration purpose we put 'boolean visualizer' to the image.alt attribute.
 */
declare module 'react' {
    interface ImgHTMLAttributes<T> {

        /** @visualizer boolean */
        alt?: string | undefined;

        /** @visualizer image */
        src?: string | undefined;
    }
}
