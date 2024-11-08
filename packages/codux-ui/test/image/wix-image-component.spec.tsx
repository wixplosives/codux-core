import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import { WixImage } from '@wixc3/codux-ui/src/image';

chai.use(chaiAsPromised);

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
    className="my custom class"
/>;
