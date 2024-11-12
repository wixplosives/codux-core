import chai, { expect } from 'chai';
import { buildWixImageUrl, WixImage } from '@wixc3/codux-ui/image';
import { chaiRetryPlugin } from '@wixc3/testing';
import { render } from '../../test-kit/render.js';

chai.use(chaiRetryPlugin);

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
