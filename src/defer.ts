/*!
 * React Defer Hooks <https://github.com/smujmaiku/react-defer-hooks>
 * Copyright(c) 2021 Michael Szmadzinski
 * MIT Licensed
 */

import { useMemo, useReducer } from "react";

export type DeferPending = [result: null, success: false];
export type DeferResult<T> = [result: T, success: true];
export type DeferReject = [result: Error, success: false];

export type Defer<T> = DeferPending | DeferResult<T> | DeferReject;

export function isPending<T>(state: Defer<T>): boolean {
	const [value, success] = state;
	return !success && value === null;
}

export function isFailed<T>(state: Defer<T>): boolean {
	const [value, success] = state;
	return !success && value instanceof Error;
}

export function isSuccess<T>(state: Defer<T>): boolean {
	const [, success] = state;
	return success;
}

export type DeferActionInit = () => void;
export type DeferActionReset = () => void;
export type DeferActionResolve<T> = (value: T) => void;
export type DeferActionReject = (error: Error) => void;
export interface DeferActions<T> {
	init: DeferActionInit;
	reset: DeferActionReset;
	resolve: DeferActionResolve<React.SetStateAction<T>>;
	reject: DeferActionReject;
}
export type DeferState<T> = [...Defer<T>, DeferActions<T>]

export type DeferReducerActionInit = [type: 'init'];
export type DeferReducerActionReset = [type: 'reset'];
export type DeferReducerActionResolve<T> = [type: 'resolve', value: React.SetStateAction<T>];
export type DeferReducerActionReject = [type: 'reject', error: Error];
export type DeferReducerAction<T> = DeferReducerActionInit | DeferReducerActionReset | DeferReducerActionResolve<T> | DeferReducerActionReject;

export function deferReducer<T>(state: Defer<T>, action: DeferReducerAction<T>): Defer<T> {
	const [type, value] = action;
	switch (type) {
	case 'init':
		return [null, false];
	case 'reset':
		if (state[0] instanceof Error) return [null, false];
		return state;
	case 'resolve':
		if (value instanceof Function) return [value(state[0] as T), true];
		return [value as T, true];
	case 'reject':
		return [value as Error, false];
	}
	return state;
}

export default function useDefer<T>(initialState?: T | Error): DeferState<T> {
	const init = useMemo<Defer<T>>(() => {
		if (arguments.length < 1) {
			return [null, false];
		} else if (initialState instanceof Error) {
			return [initialState, false];
		}
		return [initialState, true];

	}, [initialState])
	const [state, dispatch] = useReducer<React.Reducer<Defer<T>, DeferReducerAction<T>>>(deferReducer, init);

	const actions = useMemo<DeferActions<T>>(() => ({
		init: () => {
			dispatch(['init']);
		},
		reset: () => {
			dispatch(['reset']);
		},
		resolve: (value: React.SetStateAction<T>) => {
			dispatch(['resolve', value]);
		},
		reject: (error: Error) => {
			dispatch(['reject', error]);
		},
	}), []);

	return [...state, actions];
}

export function all<T extends readonly any[]>(
	list: readonly [...{ [I in keyof T]: Defer<T[I]> }],
): Defer<T> {
	const [reject] = list.filter(isFailed);
	if (reject instanceof Error) {
		return [reject, false];
	}

	const pending = list.some(isPending);
	if (pending) {
		return [null, false];
	}

	const result = list.map(([value]) => value) as any;
	return [result, true];
}
