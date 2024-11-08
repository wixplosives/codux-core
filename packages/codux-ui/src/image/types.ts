export interface WixImageAttributes {
    /** @important
     * The display name of the image.
     */
    displayName?: string;
    /** @important
     * The height of the image.
     * default: 500
     */
    height: number;
    /** @important
     * The width of the image.
     * default: 500
     */
    width: number;
    /** @important
     * The rendering strategy for the image.
     * - `fill` - The image is resized to fill the dimensions of the container, cropping the image if necessary.
     * - `fit` - The image is resized to fit the dimensions of the container, maintaining the aspect ratio of the image.
     * Default: `fit`
     */
    renderingStrategy: 'fit' | 'fill';
}

/**
 * Media breakpoint for responsive design.
 * We use min-width to determine the breakpoint.
 */
export interface MediaBreakPoint {
    /** @important */
    minWidth: number;
}

/**
 * Properties for the Wix image component
 */
export interface WixImageProps {
    /** @format wix-image-id */
    imageId: string;
    /**
     * An array of image attributes and media breakpoints.
     * Media breakpoints should be sorted by minWidth in desending order.
     */
    mediaBreakpoints: Array<WixImageAttributes & MediaBreakPoint>;
    className?: string;
    alt?: string;
}
