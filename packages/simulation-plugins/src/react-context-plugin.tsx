import { createPlugin } from '@wixc3/simulation-core';
import type { IReactStory } from '@wixc3/react-simulation/src';
import React from 'react';
export interface ContextPluginProps<T> {
    context: React.Context<T>;
    value: T;
}

export const reactContextPlugin = createPlugin<IReactStory>()<ContextPluginProps<unknown>>(
    'React-context',
    {},
    {
        wrapRender(props, _metaData, el) {
            return <props.context.Provider value={props.value}>{el}</props.context.Provider>;
        },
    },
    (params) => {
        const usedContexts = new Set<React.Context<unknown>>();
        return params.filter((p) => {
            if (usedContexts.has(p.context)) {
                return false;
            }
            usedContexts.add(p.context);
            return true;
        });
    }
);
