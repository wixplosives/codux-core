import { expect } from 'chai';
import { buildWixImageUrl, WixImageAttributes } from '@wixc3/codux-ui/image';

describe('build wix image url from wix image attributes', () => {
    const WIX_MEDIA_ROOT = 'https://static.wixstatic.com/media/';

    it('should build a valid URL with all parameters provided', () => {
        const imageId = 'wix:image://v1/someId/myImage.png';
        const attributes: WixImageAttributes = {
            displayName: 'My Test Image',
            height: 600,
            width: 800,
            renderingStrategy: 'fill',
        };

        const expectedUrl = `${WIX_MEDIA_ROOT}someId/v1/fill/w_800,h_600/My%20Test%20Image.png`;
        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal(expectedUrl);
    });

    it('should build a valid URL with default display name when displayName is not provided', () => {
        const imageId = 'wix:image://v1/anotherId/defaultImage.jpg';
        const attributes: WixImageAttributes = {
            height: 500,
            width: 500,
            renderingStrategy: 'fit',
        };

        const expectedUrl = `${WIX_MEDIA_ROOT}anotherId/v1/fit/w_500,h_500/defaultImage.jpg`;
        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal(expectedUrl);
    });

    it('should handle image ID without a file name gracefully', () => {
        const imageId = 'wix:image://v1/simpleId/';
        const attributes: WixImageAttributes = {
            displayName: 'Fallback Name',
            height: 300,
            width: 300,
            renderingStrategy: 'fit',
        };

        const expectedUrl = `${WIX_MEDIA_ROOT}simpleId/v1/fit/w_300,h_300/Fallback%20Name.0`;
        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal(expectedUrl);
    });

    it('should handle an ID with an invalid media protocol gracefully', () => {
        const imageId = 'invalid:image://format';
        const attributes: WixImageAttributes = {
            height: 400,
            width: 400,
            renderingStrategy: 'fit',
        };

        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal('https://static.wixstatic.com/media/invalid-wix-media-id/v1/fit/w_400,h_400/.0');
    });

    it('should handle an ID with an unexpected extension gracefully', () => {
        const imageId = 'wix:image://v1/someId/image_with_bad_ext';
        const attributes: WixImageAttributes = {
            displayName: 'Image with Bad Extension',
            height: 500,
            width: 500,
            renderingStrategy: 'fill',
        };

        const expectedUrl = `${WIX_MEDIA_ROOT}someId/v1/fill/w_500,h_500/Image%20with%20Bad%20Extension.0`;
        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal(expectedUrl);
    });

    it('should handle an ID without displayName or extension gracefully', () => {
        const imageId = 'wix:image://v1/onlyId';
        const attributes: WixImageAttributes = {
            height: 400,
            width: 400,
            renderingStrategy: 'fit',
        };

        const expectedUrl = `${WIX_MEDIA_ROOT}onlyId/v1/fit/w_400,h_400/.0`;
        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal(expectedUrl);
    });

    it('should handle realistic IDs correctly', () => {
        const imageId = 'wix:image://v1/c837a6_825d7dbd2e634114906169b9674b56fa~mv2.jpg/Codux Duck.jpg';
        const attributes: WixImageAttributes = {
            height: 700,
            width: 900,
            renderingStrategy: 'fit',
        };

        const expectedUrl = `${WIX_MEDIA_ROOT}c837a6_825d7dbd2e634114906169b9674b56fa~mv2.jpg/v1/fit/w_900,h_700/Codux%20Duck.jpg`;
        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal(expectedUrl);
    });

    it('should handle invalid ID with get parameter gracefully', () => {
        const imageId = 'wix:image://v1/someId/someName.invalidExtWithGet?foo=bar';
        const attributes: WixImageAttributes = {
            height: 700,
            width: 900,
            renderingStrategy: 'fit',
        };

        const expectedUrl = `${WIX_MEDIA_ROOT}someId/v1/fit/w_900,h_700/someName.invalidExtWithGet?foo=bar`;
        const result = buildWixImageUrl({ ...attributes, imageId });

        expect(result).to.equal(expectedUrl);
    });
});
