import type { HookMap, IGeneralMetadata } from './types';
export type OmitGeneralMetadata<DATA extends IGeneralMetadata<unknown, HookMap>> = Omit<DATA, '__hooks'>;

export function createMetadata<DATA extends IGeneralMetadata<unknown, HookMap>>(
    metadata: OmitGeneralMetadata<DATA>
): DATA {
    return metadata as DATA;
}
