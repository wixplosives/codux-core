import { createRenderableBase, OmitIRenderableMetaDataBase } from "./create-renderable-base";
import type { HookMap, Simulation } from "./types";

export type OmitSimulation<DATA extends Simulation<unknown, unknown, HookMap>> = Omit<OmitIRenderableMetaDataBase<DATA>, 'target'>
export function createSimulationBase<DATA extends Simulation<unknown, unknown, HookMap>>(data: OmitSimulation<DATA>): DATA {
  return createRenderableBase({ target: data.componentType, ...data }) as DATA
}