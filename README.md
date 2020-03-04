# Wcs-core

This package exposes single simulation types

Currently Work in progress


## Rendering simulations

We will expose two methods:

```ts
renderSimulation(simulation: Simulation, options?: IRenderOptions) => JSX.Element
```

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


### renderSimulation
renderSimulation must contend with the following simulation properties:

```ts
 /** The simulated component type. */
    componentType: React.ComponentType<P>;

    /** The name of the simulation. */
    name: string;

    /**
     * A map between a component property name and its simulated value.
     */
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

For the case of a wrapper, will need to do something like:
```ts
const renderSimulation = (simulation) => {
    const renderCompWithAdditionalProps = (overrides): React.ReactElement => (
        <simulation.componentType {...simulation.props} {...overrides} />
    );

    if (options?.shouldWrapComponent && simulation.wrapper) {
        return simulation.wrapper({ renderSimulation: renderCompWithAdditionalProps });
    }
}
```

For the case of environment props, we'll need to decide what exactly/how exactly we'll recreate these outside of the context of the preview environment.

And for setup, we could expose a really simple method (if needed) that just does something like:
```ts
const runSimulationSetup = (simulation: ISimulation) => simulation.setup();
```

Or just let the user call it themselves. (didn't put in the example but setup could also be an array of methods, also easy)


### renderIntoContainer

Pretty simple method. Will be something like:

```ts
const renderIntoContainer = (simulation: Simulation, container: Element, options?: IRenderOptions, callback?: () => void) => {
  const renderedSimulation = renderSimulation(simulation, options);
  ReactDOM.render(renderedSimulation, container, callback);
}
```

There was discussion about adding a third method which would let a user specify the render method, but I don't really see the point. The only reason I *could* see for this is if we decide to modify the container by adding the window environment props to it, but I think that sort of implicit behaviour is probably a no-no.