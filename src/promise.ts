/*!
 * React Defer Hooks <https://github.com/smujmaiku/react-defer-hooks>
 * Copyright(c) 2021 Michael Szmadzinski
 * MIT Licensed
 */

import { useCallback, useEffect, useState } from 'react';
import useDefer, { Defer } from './defer'

export type PromiseReloadFn = (boolean?) => void;
export type PromiseState<T> = [...Defer<T>, PromiseReloadFn];

export default function usePromise<T>(promise: () => T): PromiseState<T> {
	const [result, status, actions] = useDefer<T>();
	const [time, setTime] = useState(0);

	const {
		init, reset, resolve, reject,
	} = actions;

	useEffect(() => {
		let cancel = false;

		(async () => {
			const value = await promise();
			if (cancel) return;
			resolve(value);
		})().catch((error) => {
			if (cancel) return;
			reject(error);
		});

		return () => {
			cancel = true;
		};
	}, [promise, resolve, reject, time]);

	const reload = useCallback((hard = false) => {
		if (hard) {
			init();
		} else {
			reset();
		}
		setTime(Date.now());
	}, [init, reset]);

	return [
		...[result, status] as Defer<T>,
		reload,
	];
}
