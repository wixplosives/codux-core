import { createMetaData, OmitGeneralMetaData } from "./create-metadata";
import { callHooks, setupSimulationStage } from "./render-helpers";
import type { IRenderableMetaDataBase } from "./types";

export type OmitIRenderableMetaDataBase<DATA extends IRenderableMetaDataBase> = Omit<OmitGeneralMetaData<DATA>, 'setupStage' | 'cleanupStage'>
export function baseRender<DATA extends IRenderableMetaDataBase>(data: DATA, render: (target: HTMLElement) => void, canvas: HTMLElement): void {
    callHooks<IRenderableMetaDataBase, 'beforeRender'>(data, 'beforeRender', canvas)
    render(canvas);
    callHooks<IRenderableMetaDataBase, 'afterRender'>(data, 'afterRender', canvas)
}
export function createRenderableBase<DATA extends IRenderableMetaDataBase>(data: OmitIRenderableMetaDataBase<DATA>): DATA {
    const res: DATA = createMetaData({
        ...data,
        setupStage() {
            return setupSimulationStage(this)
        },
    } as DATA)
    return res;
}