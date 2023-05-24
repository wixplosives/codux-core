import { createBoard } from '@wixc3/react-board';
import React from 'react';

export default createBoard({
    name: 'Throwing On Click Board',
    Board: () => {
        const ref = React.useRef([1, 2, 3]);
        return (
            <div id="divId" onClick={() => ((ref.current as unknown as string) = 'not array')}>
                {ref.current.map((item) => item)}
            </div>
        );
    },
});
