import React from 'react';
import { WixImageProps } from './types';
import { buildWixImageUrl, getDefaultWixImageAttributes, wixImagePropsAreEqual } from './utils';

/**
 * Responsive Wix Image component with integration into Codux
 * It allows to define different image sizes for different screen sizes based on minWidth
 * When used with Codux it will allow to chose images through the wix media manager and saves them as an imageId
 * @param imageId - the id of the image from the wix media manager
 * @param mediaBreakpoints - an array of objects with minWidth and wix media attributes
 * @param alt - the alt text for the image
 */
export const WixImage: React.FC<WixImageProps> = React.memo(function WixImage({
    imageId,
    mediaBreakpoints,
    alt,
    ...imgProps
}) {
    const src = buildWixImageUrl({
        imageId,
        ...getDefaultWixImageAttributes(),
    });
    const { sizes, srcSet } = mediaBreakpoints
        .sort((a, b) => {
            if (a.minWidth === b.minWidth) {
                return 0;
            }
            return a.minWidth > b.minWidth ? 1 : -1;
        })
        .reduce(
            (acc, { minWidth, ...wixMediaAttributes }) => {
                const src = buildWixImageUrl({
                    imageId,
                    ...wixMediaAttributes,
                });
                return {
                    srcSet: acc.srcSet
                        ? `${src} ${wixMediaAttributes.width}w, ${acc.srcSet}`
                        : `${src} ${wixMediaAttributes.width}w`,
                    sizes: `(min-width: ${minWidth}px) ${wixMediaAttributes.width}px, ${acc.sizes}`,
                };
            },
            {
                // responsive design with 100vw as the default size
                sizes: `100vw`,
                srcSet: '',
            },
        );
    return <img {...imgProps} srcSet={srcSet} sizes={sizes} src={src} alt={alt ?? 'Image'} />;
}, wixImagePropsAreEqual);
