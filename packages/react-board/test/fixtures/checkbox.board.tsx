import React, { useState } from 'react';
import { createBoard } from '@wixc3/react-board';
import { Checkbox } from './checkbox';

export default createBoard({
    name: 'checkbox',
    Board: () => {
        const [checked, setChecked] = useState(false);
        return <Checkbox id="test-checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
    },
});
