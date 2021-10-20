/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactDOM from 'react-dom';
import {
    getPluginsWithHooks,
    baseRender,
    IRenderableLifeCycleHooks,
    IRenderableMetadataBase,
    OmitIRenderableMetadataBase,
    createRenderableBase,
} from '@wixc3/simulation-core';

export type StoryProps<DATA extends IReactStory<any>> = DATA extends IReactStory<infer PROPS> ? PROPS : never;

export type OmitReactStory<DATA extends IReactStory<any>> = Omit<
    OmitIRenderableMetadataBase<DATA>,
    'renderer' | 'cleanup' | 'props'
> & {
    props?: StoryProps<DATA>;
};
export interface IReactStory<PROPS = Record<string, never>> extends IRenderableMetadataBase<IReactStoryHooks<never>> {
    /** The name of the story. */
    name: string;

    /**
     * the story to render
     */
    story: React.ComponentType<PROPS>;

    props: PROPS;
}

/**
 * Create story of React components.
 */
export function createStory<PROPS>(input: OmitReactStory<IReactStory<PROPS>>): IReactStory<PROPS> {
    const res = createRenderableBase<IReactStory<PROPS>>({
        props: {} as PROPS,
        ...input,
        render(target, callback) {
            baseRender(
                res,
                () => {
                    let element = <res.story {...this.props} />;
                    const wrapRenderPlugins = getPluginsWithHooks(res, 'wrapRender');
                    for (const plugin of wrapRenderPlugins) {
                        if (plugin.key.plugin?.wrapRender) {
                            const el = plugin.key.plugin?.wrapRender(plugin.props as never, res, element, target);
                            element = el || element;
                        }
                    }
                    ReactDOM.render(element, target, callback);
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

export interface IReactStoryHooks<PLUGINPROPS> extends IRenderableLifeCycleHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement
    ) => null | JSX.Element;
}
