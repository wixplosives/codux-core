import { INVALID_WIX_MEDIA_ID, WIX_IMAGE_ATTRIBUTES_DEFAULT, WIX_MEDIA_ID_ROOT, WIX_MEDIA_ROOT } from './constants';
import { MediaBreakPoint, WixImageAttributes, WixImageProps } from './types';

export function buildWixImageUrl({
    imageId,
    width,
    height,
    renderingStrategy,
    displayName,
}: WixImageAttributes & { imageId: string }) {
    const { wixMediaId, fileName } = extractWixMediaIdAndTitle(imageId);
    const { title, ext } = extractFileExtension(fileName);
    const encodedFileName = `${encodeURIComponent(displayName || title)}.${ext || '0'}`;
    return `${WIX_MEDIA_ROOT}${wixMediaId}/v1/${renderingStrategy}/w_${width},h_${height}/${encodedFileName}`;
}

export function getDefaultWixImageAttributes(): WixImageAttributes {
    return WIX_IMAGE_ATTRIBUTES_DEFAULT;
}

export function wixImagePropsAreEqual(prevProps: WixImageProps, nextProps: WixImageProps): boolean {
    const { mediaBreakpoints, ...restPrevProps } = prevProps;
    const { mediaBreakpoints: nextMediaBreakpoints, ...restNextProps } = nextProps;

    if (!isWixMediaBreakpointsEqual(mediaBreakpoints, nextMediaBreakpoints)) {
        return false;
    }
    return shallowEqual(restPrevProps, restNextProps);
}

const extractWixMediaIdAndTitle = (id: string): { wixMediaId: string; fileName?: string } => {
    if (!id.startsWith(WIX_MEDIA_ID_ROOT)) {
        return { wixMediaId: INVALID_WIX_MEDIA_ID, fileName: '' };
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

function isWixMediaBreakpointsEqual(
    prevMB: (WixImageAttributes & MediaBreakPoint)[],
    nextMB: (WixImageAttributes & MediaBreakPoint)[],
) {
    if (prevMB.length !== nextMB.length) {
        return false;
    }

    for (let index = 0; index < prevMB.length; index++) {
        const { minWidth, height, width, renderingStrategy, displayName, ...rest } = prevMB[index];
        const nextMedia = nextMB[index];

        if (
            minWidth !== nextMedia.minWidth ||
            height !== nextMedia.height ||
            width !== nextMedia.width ||
            renderingStrategy !== nextMedia.renderingStrategy ||
            displayName !== nextMedia.displayName
        ) {
            return false;
        }

        // makes this logic typesafe regarding the mediaBreakpoints array
        rest satisfies Record<string, never>;
    }

    return true;
}

/**
 * https://github.com/facebook/react/blob/5c56b873efb300b4d1afc4ba6f16acf17e4e5800/packages/shared/shallowEqual.js#L13-L52
 * shallowEqual implementation similar to the one of React
 */
function shallowEqual<T extends object>(objA: T, objB: T): boolean {
    if (Object.is(objA, objB)) {
        return true;
    }

    const keysA = Object.keys(objA) as (keyof T)[];
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (const currentKey of keysA) {
        if (!Object.hasOwnProperty.call(objB, currentKey) || !Object.is(objA[currentKey], objB[currentKey])) {
            return false;
        }
    }

    return true;
}
