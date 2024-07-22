import React from 'react';

export function ContentSlot(props: { children?: React.ReactNode; className?: string; name?: string }) {
    return (
        <div className={props.className} data-content-slot={props.name}>
            {props.children}
        </div>
    );
}
