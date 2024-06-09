import { createBoard } from '@wixc3/react-board';
import React from 'react';

export default createBoard({
    name: 'Simple Board',
    Board: () => {
        return <span>Simple Board</span>;
    },
    canvas: {
        width: 500,
        height: 500,
        backgroundColor: 'blue',
    },
});
