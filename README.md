# wcs-core

[![Build Status](https://github.com/wixplosives/wcs-core/workflows/tests/badge.svg)](https://github.com/wixplosives/wcs-core/actions)
[![npm version](https://img.shields.io/npm/v/@wixc3/wcs-core.svg)](https://www.npmjs.com/package/@wixc3/wcs-core)



This package types (and helper functions for their creation) that can be used to add metadata to your project.

# Data types

## `IGenericMetaData`
A general type for describing entities in your project.

## `IRenderbleMetaData`
A type for creating renderable metadata, describing an entity in your project.

IRenderable includes methods for rendering and cleaning the render result, and can be used easily in tests, making them non-framework specific.

## `ISimulation`
A type for describing a single appearance of a component in your project.


# Factory functions

wcs-core comes out of the box with a `createReactSimulation` method used for creating simulations of React components. It is also easy to create your own methods utilizing the `IRenderable` and `ISimulation` data types.



## `createReactSimulation`

Creates a simulation for a React component.

```tsx
import {myComp} from 'somewhere';
import {createReactSimulation} from '@wixc3/wcs-core';

createReactSimulation({
    name: 'Test2',
    props: { name: 'string', children: [] },
    componentType: myComp,
});

```

# Plugins

Plugins add more metadata to simulations, modify the rendering environment, wrap the render result, and much more. For more information on plugins, see [here](./PLUGINS.md).

## Usage

```tsx
createSimulation({
    name: 'Test2',
    props: { name: 'string', children: [] },
    componentType: x,
    plugins: [
        tagPlugin.use({
            tags: ['a', 'b']
        }),
        cssVarsPlugin.use({
            '--color': 'red'
        })
    ]
});
```

This package exposes single simulation types, and [methods for testing simulations](./RENDER_HELPERS.md).