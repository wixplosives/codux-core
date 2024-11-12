import { expect } from 'chai';
import { buildWixImageUrl, WixImage } from '@wixc3/codux-ui/image';
import { render } from '../../test-kit/render.js';

describe('check rendered WixImage component', () => {
    it('should render the image with the correct src', async () => {
        const { container } = await render(<WixImage imageId="wix:image://v1/1234/duck.jpg" mediaBreakpoints={[]} />);
        expect(container.innerHTML).to.contain(
            `src="${buildWixImageUrl({ imageId: 'wix:image://v1/1234/duck.jpg', width: 500, height: 500, renderingStrategy: 'fit' })}"`,
        );
    });

    it('should render the image with passed codux attributes', async () => {
        const { container } = await render(
            <WixImage
                imageId="wix:image://v1/1234/duck.jpg"
                mediaBreakpoints={[]}
                alt="Codux duck"
                className="my-custom-class"
            />,
        );

        expect(container.innerHTML).to.contain('alt="Codux duck"');
        expect(container.innerHTML).to.contain('class="my-custom-class"');
    });

    it('should render the image with passed aria attributes', async () => {
        const { container } = await render(
            <WixImage
                imageId="wix:image://v1/1234/duck.jpg"
                mediaBreakpoints={[]}
                imgProps={{
                    ['aria-label']: 'Accessible name for the image',
                }}
            />,
        );

        expect(container.innerHTML).to.contain('aria-label="Accessible name for the image"');
    });

    it('should add sorted soures the image', async () => {
        const { container } = await render(
            <WixImage
                imageId="wix:image://v1/1234/duck.jpg"
                mediaBreakpoints={[
                    {
                        minWidth: 380,
                        height: 400,
                        width: 400,
                        renderingStrategy: 'fill',
                    },
                    {
                        minWidth: 1024,
                        height: 1000,
                        width: 1000,
                        renderingStrategy: 'fill',
                        displayName: 'duck L',
                    },
                    {
                        minWidth: 480,
                        height: 500,
                        width: 500,
                        renderingStrategy: 'fit',
                        displayName: 'duck S',
                    },
                    {
                        minWidth: 780,
                        height: 800,
                        width: 800,
                        renderingStrategy: 'fit',
                        displayName: 'duck M',
                    },
                ]}
            />,
        );

        expect(container.innerHTML).to.contain(
            '<source media="(min-width: 1024px)" srcset="https://static.wixstatic.com/media/1234/v1/fill/w_1000,h_1000/duck%20L.jpg">' +
                '<source media="(min-width: 780px)" srcset="https://static.wixstatic.com/media/1234/v1/fit/w_800,h_800/duck%20M.jpg">' +
                '<source media="(min-width: 480px)" srcset="https://static.wixstatic.com/media/1234/v1/fit/w_500,h_500/duck%20S.jpg">' +
                '<source media="(min-width: 380px)" srcset="https://static.wixstatic.com/media/1234/v1/fill/w_400,h_400/duck.jpg">',
        );
    });
});

// Type tests
<WixImage imageId="wix:image://v1/1234/duck.jpg" mediaBreakpoints={[]} />;
<WixImage imageId="wix:image://v1/1234/duck.jpg" mediaBreakpoints={[]} alt="Codux duck" className="my custom class" />;
<WixImage
    imageId="wix:image://v1/1234/duck.jpg"
    mediaBreakpoints={[
        {
            minWidth: 0,
            height: 100,
            width: 100,
            renderingStrategy: 'fill',
            displayName: 'small duck',
        },
        {
            minWidth: 480,
            height: 400,
            width: 400,
            renderingStrategy: 'fill',
            displayName: 'medium duck',
        },
        {
            minWidth: 780,
            height: 500,
            width: 800,
            renderingStrategy: 'fit',
            displayName: 'cinematic duck',
        },
    ]}
    alt="Codux duck"
    className="my-custom-class"
    imgProps={{
        ['aria-label']: 'Accessible name for the image',
    }}
/>;
