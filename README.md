# Wcs-core

This package exposes single simulation types

Currently Work in progress

## Testing with simulations
Somewhere along the line, while you were creating all those awesome simulations in Wix Component Studio, you may have wondered to yourself: is there any way I can use these in tests? The answer is yes.

`wcs-core` exports two methods for testing: `renderSimulation`, and `renderIntoContainer`. 

`simulationToJsx` takes a simulation and returns a JSX Element representing the component with the simulation props and wrapped in a wrapper (if relevant). 
```ts
simulationToJsx(simulation: Simulation) => JSX.Element;
```

`setupSimulationStage` takes a simulation and optionally, a window to apply styles to. If no window is provided this method will default to applying styles to the global window. Returns a canvas for rendering into, along with a cleanup method which unmounts all components in the canvas, removes the canvas from the DOM, and resets any styling applied to the window.
```ts
setupSimulationStage(simulation: Simulation, window?: HTMLElement) => { canvas: HTMLElement, cleanup: () => boolean };
```

Let's take a look at an example of a test running in [MochaPup](https://github.com/wixplosives/mocha-pup) (however, this example should apply to any test that has access to the window during execution). 

First, our simulation file:

```ts
import React from 'react';
import { createSimulation } from '@wixc3/wcs-core';
import Dropdown from '../../src/dropdown';

export default createSimulation({
    name: 'Dropdown with two items',
    componentType: Dropdown,
    props: {
        shouldRenderOpen: true,
        items: ['item 1', 'item 2']
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
import DropdownSimWithTwoItems from '../wcs/simulations/dropdown/two-items-sim';
import { renderToJsx, setupSimulationStage } from '@wixc3/wcs-core';
import { expect } from 'chai';
import { TestFixtureDriver } from './test-fixture.driver';
import { browser, port } from './bootstrap';
import { Page } from 'puppeteer';
import { render } from 'react-dom';
import { act } from 'react-test-utils';

describe('Dropdown', () => {
    let page: Page;

    beforeEach(async function() {
        page = await browser.newPage();
        await page.goto(`http://localhost:${port}`);
    });

    afterEach(async function() {
        await page.close();
    });

    it('should display the correct items', () => {
        const {canvas, cleanup} = setupSimulationStage(DropdownSimWithTwoItems);
        const dropdownDriver = new TestFixtureDriver(page);
        const Dropdown = renderToJsx(DropdownSimWithTwoItems);
        document.body.appendChild(canvas);
        
        act(() =>  render(Dropdown, canvas));
       
        const items = await dropdownDriver.getDropdownItems();
        expect(items).to.eql(['item1', 'item2']);
        cleanup();
    });
});
```
