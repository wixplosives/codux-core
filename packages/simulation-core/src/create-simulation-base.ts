import { createRenderableBase, OmitIRenderableMetadataBase } from './create-renderable-base';
import type { HookMap, ISimulation } from './types';

export type OmitSimulation<DATA extends ISimulation<unknown, unknown, HookMap>> = Omit<
    OmitIRenderableMetadataBase<DATA>,
    'target'
>;
export function createSimulationBase<DATA extends ISimulation<unknown, unknown, HookMap>>(
    data: OmitSimulation<DATA>
): DATA {
    return createRenderableBase({ target: data.componentType, ...data } as DATA);
}
