import { OmitIRenderableMetaDataBase, createRenderableBase } from "../create-renderable-base";
import type { HookMap, IPROPS, IRenderableMetaDataBase } from "../types";

export interface HTMLExampleHooks extends HookMap {
    modifyHTMLBeforeRender: (props: IPROPS, html: string, canvas: HTMLElement) => string
}
export interface HTMLExample extends IRenderableMetaDataBase {
    target: string;
}

export function createHTMLExample<DATA extends HTMLExample>(data: Omit<OmitIRenderableMetaDataBase<HTMLExample>, 'renderer' | 'cleanup'>): DATA {
    const res = createRenderableBase({
        renderer(canvas) {
            canvas.innerHTML = data.target
        },
        cleanup(canvas) {
            canvas.innerHTML = '';
        },

        ...data
    } as OmitIRenderableMetaDataBase<DATA>)

    return res
}