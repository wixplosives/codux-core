export interface WixImageAttributes {
    /**
     * The display name of the image.
     */
    displayName?: string;
    /**
     * The height of the image.
     * default: 500
     */
    height: number;
    /**
     * The width of the image.
     * default: 500
     */
    width: number;
    /**
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
 * Properties that are being passed to the img element.
 * Following properties are being omitted:
 *
 * *src* - is being omitted as it is build inside the component based on the imageId
 *
 * *srcSet, sizes* - are being omitted because these are configured based on the mediaBreakpoints
 *
 * *height, width* - are being omitted as the img is supposed use the Intrinsic size of the image that is loaded
 */
type ImgPropsToPass = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes' | 'height' | 'width'>;

/**
 * Properties for the Wix image component
 */
export interface WixImageProps extends ImgPropsToPass {
    /**
     * @format wix-image-id
     * @important
     */
    imageId: string;
    /**
     * An array of image attributes and media breakpoints.
     * Media breakpoints should be sorted by minWidth in desending order.
     * @important
     */
    mediaBreakpoints: Array<WixImageAttributes & MediaBreakPoint>;
    /**
     * @important
     */
    alt?: string;
}
