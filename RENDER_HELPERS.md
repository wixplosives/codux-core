# Testing with simulations

Somewhere along the line, while you were creating all those awesome simulations in Wix Component Studio, you may have asked yourself - is there a way to use these simulations in tests? The answer to this question is yes!

`wcs-core` exports three methods to help test components with simulations:

- `simulationToJsx`
- `setupSimulationStage`
- `renderSimulation`

`simulationToJsx` takes a simulation and returns a JSX Element representing the component and its simulation props. It will be wrapped in a wrapper if relevant.

```ts
simulationToJsx(simulation: ISimulation) => JSX.Element;
```

`setupSimulationStage` takes a simulation, and optionally, a window to apply styles to. Styles will be applied to the global window if no window is provided.

This method returns a canvas for rendering into, along with a cleanup method to unmount all components in the canvas, remove the canvas from the DOM, and reset any styling applied to the window.

```ts
setupSimulationStage(simulation: ISimulation, window?: HTMLElement) => { canvas: HTMLElement, cleanup: () => void };
```

The third method - `renderSimulation`, takes a simulation, and using ReactDOM, renders the result from the call to `simulationToJsx` into the canvas that was returned by `setupSimulationStage`. Note below that a cleanup method is also available.

```ts
renderSimulation(simulation: ISimulation) => { canvas: HTMLElement, cleanup: () => void };
```

Refer to [ISimulation](https://github.com/wixplosives/wcs-core/blob/d91a792a52b916fb6dc55b7a4f7c49715a010168/src/types.ts#L40) for details on this interface.

# mocha-play Example

Let's take a look at an example of a test running in [mocha-play](https://github.com/wixplosives/mocha-play). Note that this example is applicable to any test that has access to the browser window during execution.

In this example, there are two files - a simulation file and a test file.

```ts
// simulation file

import React, { useState } from 'react';
import { createSimulation } from '@wixc3/wcs-core';
import Checkbox from '../../src/Checkbox';

export default createSimulation({
  name: 'Checkbox with wrapper',
  componentType: Checkbox,
  props: {
    checked: false,
  },
  wrapper: ({ renderSimulation }) => {
    const [checked, setChecked] = useState(false);
    return renderSimulation({ checked, onChange: (e) => setChecked(e.target.checked) });
  },
  environmentProps: {
    canvasWidth: 500,
    canvasHeight: 600,
    canvasBackgroundColor: '#0f4972',
    windowWidth: 1000,
    windowHeight: 1200,
  },
});
```

```ts
// test file

import { expect } from 'chai';
import { CheckboxDriver } from './checkbox.driver';
import CheckboxWithWrapper from '../_wcs/simulations/checkbox/checkbox-with-wrapper-sim';
import { renderSimulation } from '@wixc3/wcs-core';

describe(`Checkbox`, () => {
  it(`can be toggled`, () => {
    const { canvas, cleanup } = renderSimulation(CheckboxWithWrapper);

    const checkbox = new CheckboxDriver(canvas.children[0]);

    expect(checkbox.isChecked()).equal(false);
    checkbox.toggle();
    expect(checkbox.isChecked()).equal(true);

    cleanup();
  });
});
```
