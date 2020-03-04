# Wcs-core

This package exposes single simulation types

Currently Work in progress


## Rendering simulations

We will expose two methods:

* renderSimulation:
```ts
renderSimulation(simulation: Simulation, options?: IRenderOptions) => JSX.Element
```
* renderIntoContainer:
```ts
renderIntoContainer(simulation: Simulation, container: Element, options?: IRenderOptions, callback?: () => void) => void
```

Where `IRenderOptions` is:
```ts
interface IRenderOptions {
    shouldApplyEnvironmentProps?: boolean;
    shouldWrapComponent?: boolean;
    shouldRunSetup?: boolean;
    // Needs more discussion
}
```

renderSimulation must contend with the following simulation properties:

```ts
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
```

For the case of just props, it's easy:
```ts
const renderSimulation = (simulation) => {
    return <simulation.componentType {...simulation.props} />
}
```

For the case of a wrapper:
```ts
const renderSimulation = (simulation) => {
    const unwrappedComponent = (additionalProps) => <simulation.componentType {...simulation.props} {...additionalProps} />;
    return simulation.wrapper(unwrappedComponent);
}
```

For the case of environment props, we'll need to map to inline styles around a wrapping canvas, and then save the window props for the actual container:
```ts
const renderSimulation = (simulation) => {
    return <simulation.componentType {...simulation.props} />
}
```