import React from 'react';

export function Variant(props: { children?: React.ReactNode; name?: string }) {
    return (
        <div data-variant={props.name || ''} style={{ display: 'contents' }}>
            {props.children}
        </div>
    );
}
