import { useState } from 'react';
import { Checkbox, CheckboxProps } from './checkbox';
import { createSimulation, ISimulationWrapperProps } from '../src';

const Wrapper = ({ renderSimulation }: ISimulationWrapperProps<CheckboxProps>) => {
    const [checked, setChecked] = useState(false);
    return renderSimulation({ checked, onChange: e => setChecked(e.target.checked) });
};

export default createSimulation({
    name: 'Checkbox with wrapper',
    componentType: Checkbox,
    props: {
        checked: false,
        id: 'test-checkbox'
    },
    wrapper: Wrapper,
    environmentProps: {
        canvasWidth: 500,
        canvasHeight: 600,
        canvasBackgroundColor: '#0f4972',
        windowWidth: 1000,
        windowHeight: 1200
    }
});
