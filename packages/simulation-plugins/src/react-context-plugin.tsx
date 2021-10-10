import { createPlugin } from '@wixc3/simulation-core';
import type { IReactStory } from '@wixc3/react-simulation/src';
import React from 'react';
export interface ContextPluginProps<T> {
    context: React.Context<T>;
    value: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const reactContextPlugin = createPlugin<IReactStory<any>>()<ContextPluginProps<any>>(
    'React-context',
    {},
    {
        wrapRender(props, _metaData, el) {
            return <props.context.Provider value={props.value as unknown}>{el}</props.context.Provider>;
        },
    },
    (params) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const usedContexts = new Set<React.Context<any>>();
        return params.filter((p) => {
            if (usedContexts.has(p.context)) {
                return false;
            }
            usedContexts.add(p.context);
            return true;
        });
    }
);
