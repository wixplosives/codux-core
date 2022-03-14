import type { IReactBoard } from './types';

/**
 * A method to determine if an unknown instance is a record
 * @param value an unknown instance
 * @returns if the value is a record
 */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * A method to determine if an unknown instance is a React Board
 * @param value an unknown instance
 * @returns if the value is a React Board
 */
export const ensureBoard = (value: unknown): value is IReactBoard => {
    if (!isRecord(value)) {
        throw new Error(`provided value is not an object`);
    }

    if (!value.name) {
        throw new Error(`provided value is missing a name property`);
    }

    if (!value.Board) {
        throw new Error(`provided value is missing a Board property`);
    }

    return typeof value.Board === 'function';
};
