/*!
 * React Defer Hooks <https://github.com/smujmaiku/react-defer-hooks>
 * Copyright(c) 2021 Michael Szmadzinski
 * MIT Licensed
 */

import { useMemo, useReducer } from "react";

export type DeferPending = [result: undefined, status: false];
export type DeferResult<T> = [result: T, status: true];
export type DeferReject = [result: undefined, status: Error];

export type Defer<T> = DeferPending | DeferResult<T> | DeferReject;

export function isPending<T>(state: Defer<T>): boolean {
	const [, status] = state;
	return status === false;
}

export function isRejected<T>(state: Defer<T>): boolean {
	const [, status] = state;
	return status instanceof Error;
}

export function isResolved<T>(state: Defer<T>): boolean {
	const [, status] = state;
	return status === true;
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
			return [undefined, false];
		case 'reset':
			if (state[0] instanceof Error) return [undefined, false];
			return state;
		case 'resolve':
			if (value instanceof Function) return [value(state[0] as T), true];
			return [value as T, true];
		case 'reject':
			return [undefined, value as Error];
	}
	return state;
}

export default function useDefer<T>(initialState?: T | Error): DeferState<T> {
	const init = useMemo<Defer<T>>(() => {
		if (arguments.length < 1) {
			return [undefined, false];
		} else if (initialState instanceof Error) {
			return [undefined, initialState];
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
	const rejects = list.filter(isRejected);
	if (rejects.length > 0) {
		return rejects[0];
	}

	const pending = list.some(isPending);
	if (pending) {
		return [undefined, false];
	}

	const result = list.map(([value]) => value) as any;
	return [result, true];
}
