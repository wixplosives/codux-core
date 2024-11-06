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

The `ResponsiveImage` component allows for optimized and responsive image rendering, tailored to be used with different screen sizes and with Wix Media. It dynamically generates image URLs based on a specified media ID, making it easy to implement responsive designs.

#### Example for the `ResponsiveImage` component:

```tsx
import { ResponsiveImage } from '@wixc3/codux-ui/image';

<ResponsiveImage
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

## License

MIT
