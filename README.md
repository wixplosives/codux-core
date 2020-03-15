# Wcs-core

This package exposes single simulation types

Currently Work in progress

## Testing with simulations

Somewhere along the line, while you were creating all those awesome simulations in Wix Component Studio, you may have wondered to yourself: is there any way I can use these in tests? The answer is yes.

`wcs-core` exports three methods for testing: `simulationToJsx`, `setupSimulationStage`, and `renderSimulation.

`simulationToJsx` takes a simulation and returns a JSX Element representing the component with the simulation props and wrapped in a wrapper (if relevant).

```ts
simulationToJsx(simulation: ISimulation) => JSX.Element;
```

`setupSimulationStage` takes a simulation and optionally, a window to apply styles to. If no window is provided this method will default to applying styles to the global window. Returns a canvas for rendering into, along with a cleanup method which unmounts all components in the canvas, removes the canvas from the DOM, and resets any styling applied to the window.

```ts
setupSimulationStage(simulation: ISimulation, window?: HTMLElement) => { canvas: HTMLElement, cleanup: () => void };
```

And `renderSimulation`, which takes a simulation and uses ReactDOM to render the results of calling `simulationToJsx` into the canvas returned by `setupSimulationStage`:

```ts
renderSimulation(simulation: ISimulation) => { canvas: HTMLElement, cleanup: () => void };
```

Where ISimulation is defined [here](https://github.com/wixplosives/wcs-core/blob/d91a792a52b916fb6dc55b7a4f7c49715a010168/src/types.ts#L40).

Let's take a look at an example of a test running in [MochaPup](https://github.com/wixplosives/mocha-pup) (however, this example should apply to any test that has access to the window during execution).

First, our simulation file:

```ts
import React, { useState } from 'react';
import { createSimulation } from '@wixc3/wcs-core';
import Checkbox from '../../src/Checkbox';

export default createSimulation({
    name: 'Checkbox with wrapper',
    componentType: Checkbox,
    props: {
        checked: false
    },
    wrapper: ({ renderSimulation }) => {
        const [checked, setChecked] = useState(false);
        return renderSimulation({ checked, onChange: e => setChecked(e.target.checked) });
    },
    environmentProps: {
        canvasWidth: 500,
        canvasHeight: 600,
        canvasBackgroundColor: '#0f4972',
        windowWidth: 1000,
        windowHeight: 1200
    }
});
```

Now our test file:

```ts
import { expect } from 'chai';
import { CheckboxDriver } from './checkbox.driver';
import CheckboxWithWrapper from '../_wcs/simulations/checkbox/checkbox-with-wrapper-sim';
// All we need is renderSimulation, since we have access to the DOM
import { renderSimulation } from '@wixc3/wcs-core';
import { render } from 'react-dom';

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
