/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import type {
    IRenderableLifeCycleHooks,
    IRenderableMetadataBase,
    OmitIRenderableMetadataBase,
} from '@wixc3/board-core';
export { BoardSetupFunction } from '@wixc3/board-core';

export type OmitReactBoard<DATA extends IReactBoard> = Omit<
    OmitIRenderableMetadataBase<DATA>,
    'render' | 'cleanup' | 'props'
>;

export interface IReactBoardHooks<PLUGINPROPS> extends IRenderableLifeCycleHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement
    ) => null | JSX.Element;
}

export interface IReactBoard extends IRenderableMetadataBase<IReactBoardHooks<never>> {
    /** The name of the board. */
    name: string;

    /** An image URL to be used as board's thumbnail. */
    cover?: string;

    /** List of tags to classify board's content */
    tags?: string[];

    /**
     * the board to render
     */
    Board: React.ComponentType<any>;
}
