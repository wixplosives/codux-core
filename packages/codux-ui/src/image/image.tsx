import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { WIX_MEDIA_ID_ROOT, WIX_MEDIA_ROOT } from './constants';

export default createBoard({
    name: 'Wix Media Id',
    Board: () => (
        <WixImage
            alt="wix image"
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
                    renderingStrategy: 'fill',
                    width: 600,
                },
            ]}
        />
    ),
    environmentProps: {
        windowWidth: 820,
        windowHeight: 1180,
    },
});

interface WixImageAttributes {
    displayName?: string;
    height: number;
    width: number;
    renderingStrategy: 'fit' | 'fill';
}

interface MediaBreakPoint {
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

function getDefaultWixImageAttributes(): WixImageAttributes {
    return {
        width: 500,
        height: 500,
        renderingStrategy: 'fit',
    };
}

const extractWixMediaIdAndTitle = (id: string): { wixMediaId: string; fileName?: string } => {
    if (!id.startsWith(WIX_MEDIA_ID_ROOT)) {
        return { wixMediaId: id, fileName: '' };
    }

    const wixMediaIdAndTitle = id.substring(WIX_MEDIA_ID_ROOT.length);
    const [wixMediaId, fileName] = wixMediaIdAndTitle.split('/');

    return { wixMediaId, fileName };
};

const extractFileExtension = (fileName?: string): { title: string; ext: string } => {
    if (!fileName) {
        return { title: '', ext: '0' };
    }

    const [title, ext] = fileName.split('.');
    if (!ext) {
        return { title: fileName, ext: '0' };
    }

    return { title, ext };
};

function createWixImageUrlFromWixImageAttributes({
    imageId,
    width,
    height,
    renderingStrategy,
    displayName,
}: WixImageAttributes & { imageId: string }) {
    const { wixMediaId, fileName } = extractWixMediaIdAndTitle(imageId);
    const { title, ext } = extractFileExtension(fileName);
    const encodedFileName = `${encodeURIComponent(displayName || title)}.${ext || '0'}`;
    const srcString = `${WIX_MEDIA_ROOT}${wixMediaId}/v1/${renderingStrategy}/w_${width},h_${height}/${encodedFileName}`;

    return srcString;
}

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
