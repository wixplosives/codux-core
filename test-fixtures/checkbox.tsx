import React, { FC } from 'react';

export interface CheckboxProps {
    id: string;
    checked?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Checkbox: FC<CheckboxProps> = props => {
    return <input type="checkbox" id={props.id} checked={props.checked} onChange={props.onChange} />;
};
