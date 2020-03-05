# Wcs-core

This package exposes single simulation types

Currently Work in progress

## Testing with simulations
Somewhere along the line, while you were creating all those awesome simulations in Wix Component Studio, you may have wondered to yourself: is there any way I can use these in tests? The answer is yes. Let's take a look at the how.

Before we begin, we're going to assume that you've configured your project to run tests. If you haven't, you should set that up first.

To get started, take a look at your imaginary test file, `myCompTest.ts`. We'll import one of your simulations, as well as importing a method that lets us render it, and a method that lets us clean up afterwards. We've also imported a method that lets us assert.

```ts
/// myCompTest.ts
import BasicCompSimulation from '../wcs/simulations/my-comp/basic-comp-simulation';
import {renderIntoContainer, cleanupContainer} from '@wixc3/wcs-core';
import {expect} from 'made-up-assertion-library';

```

Let's say that your tests are running in the browser so that we have access to the DOM. If we didn't, we'd have to use a different method. Later, we'll do an example using Enzyme (JSDOM).

After our imports we'll add a simple `before` and `afterEach` hook to setup and tear down everything needed for our test. Another assumption we make here is that you're loading the tests in a page where you've created some scaffolding for things to render into (like, in this case, a `div` with the id `'some-container-for-rendering-into'`).

```ts
/// myCompTest.ts
import BasicCompSimulation from '../wcs/simulations/my-comp/basic-comp-simulation';
import {renderIntoContainer, cleanupContainer} from '@wixc3/wcs-core';
import {expect} from 'made-up-assertion-library';

let container: Element = null;

before(() => {
  container = document.getElementById('some-container-for-rendering-into');
})

afterEach(() => {
  // Doesn't remove the container, just unmounts the components rendered within
  cleanupContainer(container);
})
```

Now let's add our test:

```ts
/// myCompTest.ts
import BasicCompSimulation from '../wcs/simulations/my-comp/basic-comp-simulation';
import {renderIntoContainer, cleanupContainer} from '@wixc3/wcs-core';
import {expect} from 'made-up-assertion-library';

let container: Element = null;

before(() => {
  container = document.getElementById('some-container-for-rendering-into');
})

afterEach(() => {
  cleanupContainer(container);
})

it('should render', () => {
  renderIntoContainer(basicCompSimulation, container, undefined, () => {
    // render has finished here
    expect(document.getElementById('my-comp')).to.have.rendered();
  })
})
```

The first paramter to `renderIntoContainer` is your simulation, the next, a container. Then there's an optional `options` object you can pass, if you'd like to configure how we render your simulation. And last, there's the option to pass a callback, which will be called once your simulation has been rendered.

In this case, that's when we're able to assert on the rendered component.

Now let's look at an **Enzyme** test. First, the imports. We'll grab `renderSimulation` from `'@wixc3/wcs-core'`, and Enzyme's shallow render method.

```ts
/// myCompTest.ts
import BasicCompSimulation from '../wcs/simulations/my-comp/basic-comp-simulation';
import {renderSimulation} from '@wixc3/wcs-core';
import {shallow} from 'enzyme';
import {expect} from 'made-up-assertion-library';
```

And then, even simpler than before, we'll render the simulation and assert on it. 

```ts
/// myCompTest.ts
import BasicCompSimulation from '../wcs/simulations/my-comp/basic-comp-simulation';
import {renderSimulation} from '@wixc3/wcs-core';
import {shallow} from 'enzyme';

it('should render', () => {
  const shallowComponent = shallow(renderSimulation(BasicCompSimulation));
  expect(shallowComponent).to.be.cool();
})
```

Using this method with Enzyme's `mount` looks similar.

```ts
/// myCompTest.ts
import BasicCompSimulation from '../wcs/simulations/my-comp/basic-comp-simulation';
import {renderSimulation} from '@wixc3/wcs-core';
import {mount} from 'enzyme';

it('should render', () => {
  const component = mount(renderSimulation(BasicCompSimulation));
  expect(component).to.not.be.shallow();
  component.unmount();
})
```

At the end of the day, `renderSimulation` is simply returning a JSX Element, so you can use the result of calling it as a parameter to any method that expects to render a JSX Element. For example, we can render a component to string:

```ts
import BasicCompSimulation from '../wcs/simulations/my-comp/basic-comp-simulation';
import {renderSimulation} from '@wixc3/wcs-core';
import ReactDOMServer from 'react-dom/server';

const componentString = ReactDOMServer.renderToString(renderSimulation(BasicCompSimulation));
```




## Rendering simulations

We will expose a few methods:

```ts
renderSimulation(simulation: Simulation, options?: IRenderOptions) => JSX.Element;
```

```ts
renderIntoContainer(simulation: Simulation, container: Element, options?: IRenderOptions, callback?: () => void) => () => void;
```

-- or, without returning a cleanup method --

```ts
renderIntoContainer(simulation: Simulation, container: Element, options?: IRenderOptions, callback?: () => void) => void;
```

and then just wrap React's cleanup method:

```ts
cleanupContainer(container: Element) => boolean;
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

  // Needs discussion. Should we return a cleanup method like this? 
  return () => ReactDOM.unmountComponentAtNode(container);
}
```

There was discussion about adding a third method which would let a user specify the render method, but I don't really see the point. The only reason I *could* see for this is if we decide to modify the container by adding the window environment props to it, but I think that sort of implicit behaviour is probably a no-no.
