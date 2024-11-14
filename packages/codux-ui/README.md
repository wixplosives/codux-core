# @wixc3/codux-ui

[![npm version](https://img.shields.io/npm/v/@wixc3/codux-ui.svg)](https://www.npmjs.com/package/@wixc3/codux-ui)

The `@wixc3/codux-ui` package provides a set of UI components designed to enhance the development experience within Wix's Codux platform. This includes components that handle media display, responsive design, and optimized rendering.

## Installation

To install the package, use:

```bash
npm install @wixc3/codux-ui
```

## List of componnts

### Image

Responsive Image component for Wix media images

#### Usage

The `WixImage` component allows for optimized and responsive image rendering, tailored to be used with different screen sizes and with Wix Media. It dynamically generates image URLs based on a specified media ID, making it easy to implement responsive designs.

#### Example for the `WixImage` component:

```tsx
import { WixImage } from '@wixc3/codux-ui/image';

<WixImage
  alt="Sample image"
  imageId="wix:image://v1/11062b_96503e81a83e47ed857a44be26ebd0d1~mv2.jpeg/Rustic breakfast.jpeg"
  mediaBreakpoints={[
    {
      minWidth: 800,
      height: 600,
      width: 50,
      renderingStrategy: 'fill',
    },
    {
      minWidth: 480,
      height: 50,
      width: 600,
      renderingStrategy: 'fill',
    },
  ]}
/>;
```

#### Utils

`@wixc3/codux-ui/image` also exports the `buildWixImageUrl` util. It builds an image URL from a [wix-image-id](https://dev.wix.com/docs/sdk/core-modules/sdk/media#usage) and wix media attributes.

#### Example for the `buildWixImageUrl` util:

```ts
import { buildWixImageUrl } from '@wixc3/codux-ui/image';

// returns https://static.wixstatic.com/media/11062b_96503e81a83e47ed857a44be26ebd0d1~mv2.jpeg/v1/fit/w_500,h_500/Rustic%20breakfast.jpeg
buildWixImageUrl({
  imageId: 'wix:image://v1/11062b_96503e81a83e47ed857a44be26ebd0d1~mv2.jpeg/Rustic breakfast.jpeg',
  width: 500,
  height: 500,
  renderingStrategy: 'fit',
});
```

## License

MIT
