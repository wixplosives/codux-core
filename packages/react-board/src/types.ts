/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import type {
    BoardSetupFunction,
    IPreviewEnvironmentPropsBase,
    IRenderableLifeCycleHooks,
    IRenderableMetadataBase,
    OmitGeneralMetadata,
} from '@wixc3/board-core';
export { BoardSetupFunction } from '@wixc3/board-core';

export type OmitReactBoard<DATA extends IReactBoard> = Omit<
    OmitGeneralMetadata<DATA>,
    'render' | 'cleanup' | 'props' | 'setupStage'
>;

export interface IReactBoardHooks<PLUGINPROPS> extends IRenderableLifeCycleHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement,
    ) => null | JSX.Element;
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
    /**
     * Functions for setting up the page for the board: adding global styles,
     * scripts, etc. These functions run only once before the board is mounted.
     */
    setup?: BoardSetupFunction | BoardSetupFunction[] | undefined;
    /**
     * Board's environment properties (e.g. the window size, the component alignment, etc.)
     */
    environmentProps?: IPreviewEnvironmentPropsBase | undefined;
}
