# React Defer Hooks

## Usage

### useDefer

```jsx
const state = useDefer();
const [value, success, actions] = state;
const {init, reset, resolve, reject} = actions;
```

### usePromise

```jsx
const promise = useCallback(async () => { await something() }, []);
const state = usePromise(promise);

if (!isSuccess(state)) return null;

const [value, , reload] = state;

return (
	<div>
		<div>{value}</div>
		<button onClick={() => reload()}>reload</button>
	</div>
);
```

### makeWall

Make a defer wall to validate pending data

```jsx
const [StateWall, useValue, context] = makeWall();

function Inside() {
	const value = useValue();
	<div>{value}</div>
}

function App() {
	const state = useDefer();	// or usePromise
	return (
		<StateWall
			state={state}
			pendingComponent={<div>Loading...</div>},
			failedComponent={<div>Failed</div>}
			validate={(value) => true}
		>
			<Inside />
		</StateWall>
	);
}
```

### statuses

* `isPending`
* `isFailed`
* `isSuccess`

```jsx
const state = useDefer();
const [value, success] = state;

const pending = isPending(state);
const success = isSuccess(state);
// value: some result
const failed = isFailed(state);
// value: Error
```

### all

```jsx
const a = useDefer();
const b = usePromise(promise);

const state = all([ a, b ]);
const [values, success] = state;
// values: [a, b]
```

## License

Copyright (c) 2020, Michael Szmadzinski. (MIT License)
