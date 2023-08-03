import React from 'react';

export const CSSVarsUser: React.FC = () => {
    return (
        <span
            style={{
                color: 'var( --color )',
            }}
        >
            some text
        </span>
    );
};
