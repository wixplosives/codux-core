import { WIX_MEDIA_ID_ROOT, WIX_MEDIA_ROOT } from './constants';
import { WixImageAttributes } from './types';

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
