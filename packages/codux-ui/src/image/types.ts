export interface WixImageAttributes {
    displayName?: string;
    height: number;
    width: number;
    renderingStrategy: 'fit' | 'fill';
}

export interface MediaBreakPoint {
    /** @important */
    minWidth: number;
}

export interface WixImageProps {
    /** @format wix-image-id */
    imageId: string;
    mediaBreakpoints: Array<WixImageAttributes & MediaBreakPoint>;
    className?: string;
    alt?: string;
}
