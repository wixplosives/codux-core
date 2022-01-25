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

    /**
     * the board to render
     */
    Board: React.ComponentType;
}