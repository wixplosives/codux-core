import React from 'react';
import ReactDOM from 'react-dom';
import {
    getPluginsWithHooks,
    baseRender,
    IRenderableLifeCycleHooks,
    IRenderableMetadataBase,
    OmitIRenderableMetadataBase,
    createRenderableBase,
} from '@wixc3/board-core';
import { reactErrorHandledRendering } from './react-error-handled-render';

export type OmitReactBoard<DATA extends IReactBoard> = Omit<
    OmitIRenderableMetadataBase<DATA>,
    'render' | 'cleanup' | 'props'
>;

export interface IReactBoard extends IRenderableMetadataBase<IReactBoardHooks<never>> {
    /** The name of the board. */
    name: string;

    /**
     * the board to render
     */
    Board: React.ComponentType;
}

export function createBoard(input: OmitReactBoard<IReactBoard>): IReactBoard {
    const res: IReactBoard = createRenderableBase<IReactBoard>({
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
                    await reactErrorHandledRendering(element, target);
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

export interface IReactBoardHooks<PLUGINPROPS> extends IRenderableLifeCycleHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement
    ) => null | JSX.Element;
}
