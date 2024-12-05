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
        renderableElement: React.ReactElement,
        canvas: HTMLElement,
    ) => null | React.ReactElement;
}

export interface IReactBoard extends IRenderableMetadataBase<IReactBoardHooks<never>> {
    /** The name of the board. */
    name: string;

    /** An image URL to be used as the board's thumbnail. */
    cover?: string;

    /** A list of tags. */
    tags?: string[];

    /** Defines whether the board can be used as a snippet. */
    isSnippet?: boolean;

    /** A function that indicates that board is ready to be snapshotted */
    readyToSnapshot?: () => Promise<void>;

    /** A React component representing the board. */
    Board: React.ComponentType<any>;
}
