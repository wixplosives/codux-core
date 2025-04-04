import { baseRender, createRenderableBase, getPluginsWithHooks } from '@wixc3/board-core';
import { reactErrorHandledRendering } from './react-error-handled-render';
import type { IReactBoard, OmitReactBoard } from './types';

export function createBoard(input: OmitReactBoard<IReactBoard>): IReactBoard {
    return createRenderableBase<IReactBoard>({
        ...input,
        render(this: IReactBoard, target) {
            return baseRender(
                this,
                async () => {
                    let element = <this.Board />;
                    const wrapRenderPlugins = getPluginsWithHooks(this, 'wrapRender');
                    for (const plugin of wrapRenderPlugins) {
                        if (plugin.key.plugin?.wrapRender) {
                            const el = plugin.key.plugin.wrapRender(plugin.props as never, this, element, target);
                            element = el || element;
                        }
                    }
                    return reactErrorHandledRendering(element, target);
                },
                target,
            );
        },
    });
}
