import React from 'react';
import { WixImageProps } from './types.js';
import { buildWixImageUrl, getDefaultWixImageAttributes, wixImagePropsAreEqual } from './utils.js';

/**
 * Responsive Wix Image component with integration into Codux
 * It allows to define different image sizes for different screen sizes based on minWidth
 * When used with Codux it will allow to chose images through the wix media manager and saves them as an imageId
 * Under the hood it creates a picture element with multiple source elements and an img element
 * @param imageId - the id of the image from the wix media manager
 * @param mediaBreakpoints - An array of image attributes and media breakpoints. Media breakpoints should be sorted by minWidth in desending order.
 * @param alt - the alt text for the image
 * @param imgProps - Props that are being passed to the img element inside of the picture element
 * @note The rest of the properties are being passed to the picture element
 */
export const WixImage: React.FC<WixImageProps> = React.memo(function WixImage({
    imageId,
    mediaBreakpoints,
    alt,
    imgProps,
    ...passedPictureProps
}) {
    return (
        <picture {...passedPictureProps}>
            {[...mediaBreakpoints]
                .sort((a, b) => {
                    if (a.minWidth === b.minWidth) {
                        return 0;
                    }
                    return a.minWidth > b.minWidth ? -1 : 1;
                })
                .map(({ minWidth, ...wixMediaAttributes }) => {
                    const src = buildWixImageUrl({
                        imageId,
                        ...wixMediaAttributes,
                    });
                    return <source key={`${minWidth}-${src}`} media={`(min-width: ${minWidth}px)`} srcSet={src} />;
                })}
            <img
                {...imgProps}
                src={buildWixImageUrl({
                    imageId,
                    ...getDefaultWixImageAttributes(),
                })}
                alt={alt ?? 'Image'}
            />
        </picture>
    );
}, wixImagePropsAreEqual);
