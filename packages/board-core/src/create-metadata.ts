import type { HookMap, IGeneralMetadata } from './types';

export type OmitGeneralMetadata<DATA extends IGeneralMetadata<HookMap>> = Omit<DATA, '__hooks'>;

export function createMetadata<DATA extends IGeneralMetadata<HookMap>>(metadata: OmitGeneralMetadata<DATA>): DATA {
    return metadata as DATA;
}
