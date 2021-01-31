/*!
 * React Defer Hooks <https://github.com/smujmaiku/react-defer-hooks>
 * Copyright(c) 2021 Michael Szmadzinski
 * MIT Licensed
 */

import { Defer, isPending, isRejected } from './defer';
import React, { createContext, useContext } from 'react';

export interface WallPropsI<T> {
	children: JSX.Element | JSX.Element[];
	state: Defer<T>;
	pendingComponent?: JSX.Element | JSX.Element[];
	failedComponent?: JSX.Element | JSX.Element[];
	validate?: (value: T) => boolean;
}

export type WallFn<T> = (props: WallPropsI<T>) => JSX.Element | JSX.Element[];

export default function makeWall<T>(): [Wall: WallFn<T>, useWall: () => T, context: React.Context<T>] {
	const context = createContext<T | null>(null);

	function useWall() {
		return useContext(context);
	}

	function Wall(props: WallPropsI<T>) {
		const {
			children,
			state,
			pendingComponent = null,
			failedComponent = null,
			validate = () => true,
		} = props;

		if (isPending(state)) {
			return pendingComponent;
		}

		const [value] = state;

		if (isRejected(state) || !validate(value as T)) {
			return failedComponent;
		}

		return (
			<context.Provider value={value as T}>
				{children}
			</context.Provider>
		);
	}

	return [Wall, useWall, context];
}
