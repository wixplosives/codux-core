import type { IGeneralMetaData } from "./types";
export type OmitGeneralMetaData<DATA extends IGeneralMetaData<any, any>> = Omit<DATA, '__hooks'>

export function createMetaData<DATA extends IGeneralMetaData<any, {}>>(metadata: OmitGeneralMetaData<DATA>): DATA {
    return metadata as DATA;
}