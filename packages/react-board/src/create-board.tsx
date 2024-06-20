import React from 'react';
import { getPluginsWithHooks, baseRender, createMetadata } from '@wixc3/board-core';
import { reactErrorHandledRendering } from './react-error-handled-render';
import type { IReactBoard, OmitReactBoard } from './types';
import { setupBoardStage } from './setup-stage';

export function createBoard(input: OmitReactBoard<IReactBoard>): IReactBoard {
    const res: IReactBoard = createMetadata<IReactBoard>({
        ...input,
        render(target) {
            return baseRender(
                res,
                async () => {
                    let element = <res.Board />;
                    const wrapRenderPlugins = getPluginsWithHooks(res, 'wrapRender');
                    for (const plugin of wrapRenderPlugins) {
                        if (plugin.key.plugin?.wrapRender) {
                            const el = plugin.key.plugin.wrapRender(plugin.props as never, res, element, target);
                            element = el || element;
                        }
                    }
                    return reactErrorHandledRendering(element, target);
                },
                target,
            );
        },
        setupStage(parentElement = document.body) {
            return setupBoardStage(this, parentElement);
        },
    });
    return res;
}
