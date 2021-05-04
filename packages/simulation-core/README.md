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

## License

MIT
