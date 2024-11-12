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
 * *srcSet* - are being omitted because these are configured based on the mediaBreakpoints
 */
type ImgPropsToPass = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'>;

/**
 * Properties for the Wix image component
 */
export interface WixImageProps extends React.HtmlHTMLAttributes<HTMLPictureElement> {
    /**
     * @format wix-image-id
     * @important
     */
    imageId: string;
    /**
     * @important
     */
    mediaBreakpoints: Array<WixImageAttributes & MediaBreakPoint>;
    /**
     * @important
     */
    alt?: string;
    /**
     * @important
     */
    className?: string;
    /**
     * @important
     */
    imgProps?: ImgPropsToPass;
}
