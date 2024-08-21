import { baseRender, createRenderableBase, getPluginsWithHooks } from '@wixc3/board-core';
import { reactErrorHandledRendering } from './react-error-handled-render';
import type { IReactBoard, OmitReactBoard } from './types';

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
                    return reactErrorHandledRendering(element, target);
                },
                target,
            );
        },
    });
    return res;
}
