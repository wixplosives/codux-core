import React from 'react';

export function ContentSlot(props: { children?: React.ReactNode; name?: string }) {
    return (
        <div data-content-slot={props.name || ''} style={{ display: 'contents' }}>
            {props.children}
        </div>
    );
}
