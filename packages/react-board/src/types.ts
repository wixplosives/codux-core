/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import type {
    ICanvasEnvironmentProps,
    ICanvasEnvironmentPropsOld,
    IPreviewEnvironmentPropsBase,
    IRenderableMetadataBase,
    IWindowEnvironmentProps,
    IWindowEnvironmentPropsOld,
} from '@wixc3/board-core';

export type OmitReactBoard<DATA extends IReactBoard> = Omit<
    DATA,
    'render' | 'cleanup' | 'props' | 'setupStage' | 'version'
>;

export interface IReactBoard extends IRenderableMetadataBase {
    /** Defines whether the board can be used as a snippet. */
    isSnippet?: boolean;

    /**
     * if canvas object is omitted no canvas will be rendered around the element
     */
    canvas?: ICanvasEnvironmentProps;

    /**
     * Board's environment properties (e.g. the window size, the component alignment, etc.)
     * @deprecated use window and canvas instead
     */
    environmentProps?: IPreviewEnvironmentPropsBase | undefined;
    /**
     * Functions for setting up the page for the board: adding global styles,
     * scripts, etc. These functions run only once before the board is mounted.
     */
    setup?: BoardSetupFunction | BoardSetupFunction[] | undefined;
    /** A React component representing the board. */
    Board: React.ComponentType<any>;
    plugins?: BoardPlugin[];
    /**
     * sets the stage for the renderer.
     * this function has many side effects ( such as effecting window styles and sizes )
     *
     * @returns canvas an html element for rendering into, cleanup a method for cleaning up the side-effects
     *
     */
    setupStage: (parentElement?: HTMLElement) => ReturnType<BoardSetupStageFunction>;
    /**
     * Renders the Renderable into an html element
     *
     * @returns a cleanup function
     */
    render: (targetElement: HTMLElement) => Promise<() => void>;
    version: number;
}

export interface BoardPlugin {
    onInit?: (board: IReactBoard) => void;
    WrapRender?: ({ children }: { children: React.ReactNode; board: IReactBoard }) => React.ReactNode;
}

export interface BoardStage {
    canvas: HTMLElement;
    cleanup: () => void;
    updateCanvas: (canvasEnvironmentProps?: ICanvasEnvironmentProps) => HTMLElement;
    updateWindow: (windowEnvironmentProps: IWindowEnvironmentProps) => void;
}

export interface BoardStageVer0 {
    canvas: HTMLElement;
    cleanup: () => void;
    updateCanvas: (canvasEnvironmentProps?: ICanvasEnvironmentPropsOld) => HTMLElement;
    updateWindow: (windowEnvironmentProps: IWindowEnvironmentPropsOld) => void;
}

export type BoardSetupStageFunction = (board: IReactBoard, parentElement?: HTMLElement) => BoardStage;

export interface ISetupController {
    addScript(scriptUrl: string): Promise<void>;
    addStylesheet(stylesheetUrl: string): Promise<void>;
}

export type BoardSetupFunction = (controller: ISetupController) => void | Promise<void>;
