import { createPlugin } from '@wixc3/board-core';
import type { IReactBoard } from '@wixc3/react-board';
import React from 'react';

export interface WrapperPluginProps {
    wrapper: React.ComponentType<React.PropsWithChildren>;
}

export const reactWrapperPlugin = createPlugin<IReactBoard>()<WrapperPluginProps>(
    'React-wrapper',
    {},
    {
        wrapRender({ wrapper: WrapperComponent }, _metaData, el) {
            return <WrapperComponent>{el}</WrapperComponent>;
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
