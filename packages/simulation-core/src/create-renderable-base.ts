import type { IRenderableMetadataBase } from './types';
import { createMetadata, OmitGeneralMetadata } from './create-metadata';
import { setupSimulationStage } from './setup-stage';
import { callHooks } from './hooks';

export type OmitIRenderableMetadataBase<DATA extends IRenderableMetadataBase> = Omit<
    OmitGeneralMetadata<DATA>,
    'setupStage' | 'cleanupStage'
>;

export async function baseRender<DATA extends IRenderableMetadataBase>(
    data: DATA,
    render: (target: HTMLElement) => Promise<void>,
    canvas: HTMLElement
): Promise<void> {
    callHooks<IRenderableMetadataBase, 'beforeRender'>(data, 'beforeRender', canvas);
    await render(canvas);
    callHooks<IRenderableMetadataBase, 'afterRender'>(data, 'afterRender', canvas);
}

export function createRenderableBase<DATA extends IRenderableMetadataBase>(
    data: OmitIRenderableMetadataBase<DATA>
): DATA {
    const res: DATA = createMetadata({
        ...data,
        setupStage(parentElement: HTMLElement = document.body) {
            return setupSimulationStage(this, parentElement);
        },
    } as DATA);
    return res;
}
