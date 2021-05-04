# @wixc3/simulation-core

[![npm version](https://img.shields.io/npm/v/@wixc3/simulation-core.svg)](https://www.npmjs.com/package/@wixc3/simulation-core)

This package exposes single simulation types, and methods for testing simulations.

## Helpers

### `simulationToJsx`

```tsx
function simulationToJsx(simulation: ISimulation): JSX.Element;
```

Takes a simulation and returns a JSX Element representing the component and its simulation props. It will be wrapped in wrapper if simulation contains one.

### `setupSimulationStage`

```tsx
function setupSimulationStage(
  simulation: ISimulation,
  window?: HTMLElement
): { canvas: HTMLElement; cleanup: () => void };
```

Takes a simulation, and optionally, a window to apply styles to. Styles will be applied to the global window if no window is provided.

This method returns a canvas for rendering into, along with a cleanup method to unmount all components in the canvas, remove the canvas from the DOM, and reset any styling applied to the window.

### `renderSimulation`

```tsx
function renderSimulation(simulation: ISimulation): { canvas: HTMLElement; cleanup: () => void };
```

Takes a simulation, and using ReactDOM, renders the result from the call to `simulationToJsx` into the canvas that was returned by `setupSimulationStage`. Note below that a cleanup method is also available.

## Plugins

Plugins can add more meta data, modify the rendering environment, wrap the render result and much more.
Plugins are specific to a sub-type of `IGeneralMetadata` and can use the hooks supplied by the meta data type.

For instance, `cssVarsPlugin` is only applicable to `IRenderable` and uses the `beforeRender` hook.

### Built-in Plugins

## tagPlugin

Adds relevant tags to the simulation. Useful for indexing the simulations.

## cssVarsPlugin

Accepts a record containing css var names and values to give them during the simulation.
Adds those css variables to the convas style.

## Example plugin usage

```tsx
import { createSimulation } from '@wixc3/react-simulation';
import { tagPlugin, cssVarsPlugin } from '@wixc3/simulation-core';
import { AutoComplete } from './auto-complete';

createSimulation({
  name: 'some simulation',
  props: { name: 'Joe' },
  componentType: AutoComplete,
  plugins: [
    tagPlugin.use({
      tags: ['react', 'forms', 'completions'],
    }),
    cssVarsPlugin.use({
      '--label-color': 'red',
    }),
  ],
});
```

## License

MIT
