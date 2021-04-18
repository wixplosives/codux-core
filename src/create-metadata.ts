import type { HookMap, IGeneralMetaData } from "./types";
export type OmitGeneralMetaData<DATA extends IGeneralMetaData<unknown, HookMap>> = Omit<DATA, '__hooks'>

export function createMetaData<DATA extends IGeneralMetaData<unknown, HookMap>>(metadata: OmitGeneralMetaData<DATA>): DATA {
    return metadata as DATA;
}