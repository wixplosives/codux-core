import { createRenderableBase, OmitIRenderableMetaDataBase } from "./create-renderable-base";
import type {  Simulation } from "./types";

export type OmitSimulation<DATA extends Simulation<unknown, unknown, any>> = Omit<OmitIRenderableMetaDataBase<DATA>, 'target'>
export function createSimulationBase<DATA extends Simulation<unknown, unknown, {}>>(data: OmitSimulation<DATA>): DATA {
  return createRenderableBase({ target: data.componentType, ...data }) as DATA
}