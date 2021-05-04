import { createMetadata, OmitGeneralMetadata } from './create-metadata';
import { callHooks, setupSimulationStage } from './render-helpers';
import type { IRenderableMetadataBase } from './types';

export type OmitIRenderableMetadataBase<DATA extends IRenderableMetadataBase> = Omit<
    OmitGeneralMetadata<DATA>,
    'setupStage' | 'cleanupStage'
>;
export function baseRender<DATA extends IRenderableMetadataBase>(
    data: DATA,
    render: (target: HTMLElement) => void,
    canvas: HTMLElement
): void {
    callHooks<IRenderableMetadataBase, 'beforeRender'>(data, 'beforeRender', canvas);
    render(canvas);
    callHooks<IRenderableMetadataBase, 'afterRender'>(data, 'afterRender', canvas);
}
export function createRenderableBase<DATA extends IRenderableMetadataBase>(
    data: OmitIRenderableMetadataBase<DATA>
): DATA {
    const res: DATA = createMetadata({
        ...data,
        setupStage() {
            return setupSimulationStage(this);
        },
    } as DATA);
    return res;
}
