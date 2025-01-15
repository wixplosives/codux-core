import { createBoard } from '@wixc3/react-board';
import { useState } from 'react';
import { Checkbox } from './checkbox.js';

export default createBoard({
    name: 'checkbox',
    Board: () => {
        const [checked, setChecked] = useState(false);
        return <Checkbox id="test-checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
    },
});
