import React from 'react';
import { WixImageProps } from './types';
import { createWixImageUrlFromWixImageAttributes, getDefaultWixImageAttributes } from './utils';

export const WixImage: React.FC<WixImageProps> = ({ className, imageId, mediaBreakpoints, alt }) => {
    return (
        <picture className={className}>
            {mediaBreakpoints.map(({ minWidth, ...wixMediaAttributes }, index) => {
                const src = createWixImageUrlFromWixImageAttributes({
                    imageId,
                    ...wixMediaAttributes,
                });
                return <source key={index} media={`(min-width: ${minWidth}px)`} srcSet={src} />;
            })}
            <img
                src={createWixImageUrlFromWixImageAttributes({
                    imageId,
                    ...getDefaultWixImageAttributes(),
                })}
                alt={alt ?? 'Image'}
                className={className}
            />
        </picture>
    );
};
