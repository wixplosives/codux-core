# wcs-core

[![Build Status](https://github.com/wixplosives/wcs-core/workflows/tests/badge.svg)](https://github.com/wixplosives/wcs-core/actions)
[![npm version](https://img.shields.io/npm/v/@wixc3/wcs-core.svg)](https://www.npmjs.com/package/@wixc3/wcs-core)



This package exposes types ( and helper funcions for their creation ) that can be used to add meta data to your project.

# Data types

## IGenericMetaData
a general type for describing entities in your project

## IRenderbleMetaData
a type for creating renderable metadata, describing an entitiy in your project.

IRenderable includes methods for rendering and cleaning the render result, and can be used easily in tests making them non framework specific.

## ISimulation
a type for describing a single appearance of a component in your project


# Factory functions

wcs-core offers createReactSimulation that creates a simulation for a react component.
but you can easily create your own methods for creating the IRenderable and ISimulation data types



## createReactSimulation

creates a simulation for a react component.

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

Plugins can add more meta data, modify the rendering environment, wrap the render result and do many more things.
read more about plugins [here](./PLUGINS.md)

## usage


```
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







This package exposes single simulation types, and some [methods for testing simulations](./TEST_HELPERS.md).
