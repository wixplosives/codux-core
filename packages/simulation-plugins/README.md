# @wixc3/simulation-plugins

[![npm version](https://img.shields.io/npm/v/@wixc3/simulation-plugins.svg)](https://www.npmjs.com/package/@wixc3/simulation-plugins)

Plugins can add more meta data, modify the rendering environment, wrap the render result and much more.
Plugins are specific to a sub-type of `IGeneralMetadata` and can use the hooks supplied by the meta data type.

For instance, `cssVarsPlugin` is only applicable to `IRenderable` and uses the `beforeRender` hook.

## Usage

```tsx
import { createSimulation } from '@wixc3/react-simulation';
import { tagsPlugin, cssVarsPlugin } from '@wixc3/simulation-plugins';
import { AutoComplete } from './auto-complete';

createSimulation({
  name: 'some simulation',
  props: { name: 'Joe' },
  componentType: AutoComplete,
  plugins: [
    tagsPlugin.use({
      tags: ['react', 'forms', 'completions'],
    }),
    cssVarsPlugin.use({
      '--label-color': 'red',
    }),
  ],
});
```

## tagsPlugin

Adds relevant tags to the simulation. Useful for indexing the simulations.

## cssVarsPlugin

Accepts a record containing css var names and values to give them during the simulation.
Adds those css variables to the convas style.

## License

MIT
