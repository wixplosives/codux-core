# @wixc3/board-plugins

[![npm version](https://img.shields.io/npm/v/@wixc3/board-plugins.svg)](https://www.npmjs.com/package/@wixc3/board-plugins)

Plugins can add more meta data, modify the rendering environment, wrap the render result and much more.
Plugins are specific to a sub-type of `IGeneralMetadata` and can use the hooks supplied by the meta data type.

For instance, `cssVarsPlugin` is only applicable to `IRenderable` and uses the `beforeRender` hook.

## Usage

```tsx
import { createBoard } from '@wixc3/react-board';
import { tagsPlugin, cssVarsPlugin } from '@wixc3/board-plugins';
import { AutoComplete } from './auto-complete.js';

createBoard({
  name: 'some board',
  Board: () => <AutoComplete />,
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

Adds relevant tags to the board. Useful for indexing the boards.

## cssVarsPlugin

Accepts a record containing css var names and values to give them during rendering.
Adds those css variables to the canvas style.

## License

MIT
