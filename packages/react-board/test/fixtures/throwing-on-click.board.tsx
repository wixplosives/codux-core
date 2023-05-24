import { createBoard } from '@wixc3/react-board';
import React from 'react';

export default createBoard({
    name: 'Throwing On Click Board',
    Board: () => {
        const renderCount = React.useRef(1);
        if (renderCount.current === 2) {
            throw new Error('Intentional Error on re-render');
        }
        renderCount.current++;
        return <div>Rendered</div>;
    },
});
