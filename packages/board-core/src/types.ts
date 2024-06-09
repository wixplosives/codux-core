export type LayoutSize = number | undefined | null;

export type LayoutSizeWithAuto = LayoutSize | 'auto';

export interface LayoutSpacing {
    /** @visualizer spacing */
    top?: LayoutSize | undefined;
    /** @visualizer spacing */
    right?: LayoutSize | undefined;
    /** @visualizer spacing */
    bottom?: LayoutSize | undefined;
    /** @visualizer spacing */
    left?: LayoutSize | undefined;
}

export type IPreviewEnvironmentPropsBase = IWindowEnvironmentPropsOld & ICanvasEnvironmentPropsOld;

export interface IWindowEnvironmentPropsOld {
    /** @visualizer spacing */
    windowWidth?: number | undefined;
    /** @visualizer spacing */
    windowHeight?: number | undefined;
    /** @visualizer color */
    windowBackgroundColor?: string | undefined;
}

export interface IWindowEnvironmentProps {
    /** @visualizer spacing */
    width?: number | undefined;
    /** @visualizer spacing */
    height?: number | undefined;
    /** @visualizer color */
    backgroundColor?: string | undefined;
}

export interface ICanvasEnvironmentPropsOld {
    /** @visualizer spacing */
    width?: LayoutSizeWithAuto | undefined;
    /** @visualizer spacing */
    height?: LayoutSizeWithAuto | undefined;
    /** @visualizer color */
    backgroundColor?: string | undefined;
    /** @visualizer canvasMargin */
    margin?: LayoutSpacing | undefined;
    /** @visualizer canvasPadding */
    padding?: LayoutSpacing | undefined;
}

export interface ICanvasEnvironmentProps {
    /** @visualizer spacing */
    width?: LayoutSizeWithAuto | undefined;
    /** @visualizer spacing */
    height?: LayoutSizeWithAuto | undefined;
    /** @visualizer color */
    backgroundColor?: string | undefined;
    /** @visualizer canvasMargin */
    margin?: LayoutSpacing | undefined;
    /** @visualizer canvasPadding */
    padding?: LayoutSpacing | undefined;
}

export interface IRenderableMetadataBase {
    /** The name of the board. */
    name: string;

    /** An image URL to be used as the board's thumbnail. */
    cover?: string;

    /** A list of tags. */
    tags?: string[];

    window?: IWindowEnvironmentProps;

    /** A function that indicates that board is ready to be snapshotted */
    readyToSnapshot?: () => Promise<void>;
}

export type CanvasStyles = Pick<
    CSSStyleDeclaration,
    | 'height'
    | 'width'
    | 'paddingLeft'
    | 'paddingRight'
    | 'paddingBottom'
    | 'paddingTop'
    | 'marginLeft'
    | 'marginRight'
    | 'marginBottom'
    | 'marginTop'
>;
