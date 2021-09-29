/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactDOM from 'react-dom';
import {
    getPluginsWithHooks,
    baseRender,
    IRenderableHooks,
    IRenderableMetadataBase,
    OmitIRenderableMetadataBase,
    createRenderableBase,
} from '@wixc3/simulation-core';

export type OmitReactStory<DATA extends IReactStory> = Omit<OmitIRenderableMetadataBase<DATA>, 'renderer' | 'cleanup'>;
export interface IReactStory extends IRenderableMetadataBase<IReactStoryHooks<never>> {
    /** The name of the story. */
    name: string;

    /**
     * the story to render
     */
    story: React.ComponentType<Record<string, never>>;
}

/**
 * Create story of React components.
 */
export function createStory(input: OmitReactStory<IReactStory>): IReactStory {
    const res = createRenderableBase<IReactStory>({
        ...input,
        renderer(target) {
            baseRender(
                res,
                () => {
                    let element = <res.story />;
                    const wrapRenderPlugins = getPluginsWithHooks(res, 'wrapRender');
                    for (const plugin of wrapRenderPlugins) {
                        if (plugin.key.plugin?.wrapRender) {
                            const el = plugin.key.plugin?.wrapRender(plugin.props as never, res, element, target);
                            element = el || element;
                        }
                    }
                    ReactDOM.render(element, target);
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

export interface IReactStoryHooks<PLUGINPROPS> extends IRenderableHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement
    ) => null | JSX.Element;
}
