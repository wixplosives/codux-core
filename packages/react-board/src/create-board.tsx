import React from 'react';
import { reactErrorHandledRendering } from './react-error-handled-render';
import type { IReactBoard, OmitReactBoard } from './types';
import { setupBoardStage } from './setup-stage';

export function createBoard(input: OmitReactBoard<IReactBoard>): IReactBoard {
    const res: IReactBoard = {
        ...input,
        render(target) {
            let element = <res.Board />;
            const wrapRenderPlugins = this.plugins;
            if (wrapRenderPlugins) {
                for (const plugin of wrapRenderPlugins) {
                    if (plugin.WrapRender) {
                        const el = <plugin.WrapRender board={this}>{element}</plugin.WrapRender>;
                        element = el || element;
                    }
                }
            }
            return reactErrorHandledRendering(element, target);
        },
        setupStage(el) {
            return setupBoardStage(this, el);
        },
        version: '1',
    };

    const plugins = res.plugins;
    if (plugins) {
        for (const plugin of plugins) {
            if (plugin.onInit) {
                plugin.onInit(res);
            }
        }
    }
    return res;
}
