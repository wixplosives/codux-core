import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot} from 'react-dom/client';
import { getPluginsWithHooks, baseRender, createRenderableBase } from '@wixc3/board-core';
import { reactErrorHandledRendering } from './react-error-handled-render';
import type { IReactBoard, OmitReactBoard } from './types';

export function createBoard(input: OmitReactBoard<IReactBoard>): IReactBoard {
    const res: IReactBoard = createRenderableBase<IReactBoard>({
        ...input,
        render(target) {
            const root = createRoot(target)
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
                    await reactErrorHandledRendering(element,root);
                },
                target
            );
        },
        cleanup(target) {
            ReactDOM.unmountComponentAtNode(target);
        },
    });
    return res;
}
