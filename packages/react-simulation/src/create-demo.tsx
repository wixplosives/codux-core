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

export type DemoProps<DATA extends IReactDemo<any>> = DATA extends IReactDemo<infer PROPS> ? PROPS : never;

export type OmitReactDemo<DATA extends IReactDemo<any>> = Omit<
    OmitIRenderableMetadataBase<DATA>,
    'render' | 'cleanup' | 'props'
> & {
    props?: DemoProps<DATA>;
};
export interface IReactDemo<PROPS = Record<string, never>> extends IRenderableMetadataBase<IReactDemoHooks<never>> {
    /** The name of the demo. */
    name: string;

    /**
     * the demo to render
     */
    demo: React.ComponentType<PROPS>;

    props: PROPS;
}

/**
 * Create demo of React components.
 */
export function createDemo<PROPS>(input: OmitReactDemo<IReactDemo<PROPS>>): IReactDemo<PROPS> {
    const res: IReactDemo<PROPS> = createRenderableBase<IReactDemo<PROPS>>({
        props: {} as PROPS,
        ...input,
        render(target) {
            return baseRender(
                res,
                async () => {
                    let element = <res.demo {...this.props} />;
                    const wrapRenderPlugins = getPluginsWithHooks(res, 'wrapRender');
                    for (const plugin of wrapRenderPlugins) {
                        if (plugin.key.plugin?.wrapRender) {
                            const el = plugin.key.plugin.wrapRender(plugin.props as never, res, element, target);
                            element = el || element;
                        }
                    }
                    await new Promise<void>((res) => {
                        ReactDOM.render(element, target, res);
                    });
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

export interface IReactDemoHooks<PLUGINPROPS> extends IRenderableLifeCycleHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement
    ) => null | JSX.Element;
}
