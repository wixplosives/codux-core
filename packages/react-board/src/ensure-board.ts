import type { IReactBoard } from './types';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const ensureBoard = (value: unknown): value is IReactBoard => {
    if (!isRecord(value)) {
        throw new Error(`provided value is not an object`);
    }

    if (!value.name) {
        throw new Error(`provided value is missing a name`);
    }

    if (!value.Board) {
        throw new Error(`provided value is missing a Board param`);
    }

    return true;
};
