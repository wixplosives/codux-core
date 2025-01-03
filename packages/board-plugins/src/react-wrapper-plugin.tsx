import { createPlugin } from '@wixc3/board-core';
import type { IReactBoard } from '@wixc3/react-board';
import React from 'react';

export interface WrapperPluginProps<T extends Record<string, unknown> = Record<string, unknown>> {
    wrapper: React.ComponentType<React.PropsWithChildren<T>>;
    props?: T;
}

export const reactWrapperPlugin = createPlugin<IReactBoard>()<WrapperPluginProps>(
    'React-wrapper',
    {},
    {
        wrapRender({ wrapper: WrapperComponent, props = {} }, _metaData, el) {
            return <WrapperComponent {...props}>{el}</WrapperComponent>;
        },
    },
    (params) => {
        const usedWrappers = new Set<WrapperPluginProps['wrapper']>();
        return params.filter((p) => {
            if (usedWrappers.has(p.wrapper)) {
                return false;
            }
            usedWrappers.add(p.wrapper);
            return true;
        });
    },
);
