import type { BoardPlugin } from '@wixc3/react-board';
import React from 'react';
export interface ContextPluginProps<T> {
    context: React.Context<T>;
    value: T;
}

export function reactContextPlugin<T>(props: ContextPluginProps<T>): BoardPlugin {
    return {
        WrapRender({ children }) {
            return <props.context.Provider value={props.value}>{children}</props.context.Provider>;
        },
    };
}
