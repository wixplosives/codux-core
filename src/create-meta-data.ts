import type { IGeneralMetaData } from "./types";

export function createMetaData<TARGET>(metadata: IGeneralMetaData<TARGET, {}>) {
    return metadata;
}