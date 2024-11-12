import React from 'react';
import { WixImageProps } from './types.js';
import { buildWixImageUrl, getDefaultWixImageAttributes, wixImagePropsAreEqual } from './utils.js';

/**
 * Responsive Wix Image component with integration into Codux
 * It allows to define different image sizes for different screen sizes based on minWidth
 * When used with Codux it will allow to chose images through the wix media manager and saves them as an imageId
 * @param imageId - the id of the image from the wix media manager
 * @param mediaBreakpoints - an array of objects with minWidth and wix media attributes
 * @param alt - the alt text for the image
 */
export const WixImage: React.FC<WixImageProps> = React.memo(function WixImage({
    className,
    imageId,
    mediaBreakpoints,
    alt,
}) {
    return (
        <picture className={className}>
            {mediaBreakpoints.map(({ minWidth, ...wixMediaAttributes }, index) => {
                const src = buildWixImageUrl({
                    imageId,
                    ...wixMediaAttributes,
                });
                return <source key={index} media={`(min-width: ${minWidth}px)`} srcSet={src} />;
            })}
            <img
                src={buildWixImageUrl({
                    imageId,
                    ...getDefaultWixImageAttributes(),
                })}
                alt={alt ?? 'Image'}
                className={className}
            />
        </picture>
    );
}, wixImagePropsAreEqual);
