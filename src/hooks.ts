import { useCallback, useEffect, useLayoutEffect, useRef, RefObject } from 'react';

import { defer, cancelDefer } from './utils/defer';
import { setInputSelection, getInputSelection, isInputFocused, type InputSelection } from './utils/input';
import { isDOMElement } from './utils/helpers';

export function useInputElement(inputRef: RefObject<HTMLElement | null>): () => HTMLInputElement | null {
	return useCallback(() => {
		let input = inputRef.current;
		const isDOMNode = typeof window !== 'undefined' && isDOMElement(input);

		// workaround for react-test-renderer
		// https://github.com/sanniassin/react-input-mask/issues/147
		if (!input || !isDOMNode) {
			return null;
		}

		if (input.nodeName !== 'INPUT') {
			const foundInput = input.querySelector('input');
			if (!foundInput) {
				throw new Error("react-input-mask: inputComponent doesn't contain input node");
			}
			input = foundInput;
		}

		return input as HTMLInputElement;
	}, [inputRef]);
}

function useDeferLoop(callback: () => void): [() => void, () => void] {
	const deferIdRef = useRef<number | null>(null);

	const runLoop = useCallback(() => {
		// If there are simulated focus events, runLoop could be
		// called multiple times without blur or re-render
		if (deferIdRef.current !== null) {
			return;
		}

		function loop() {
			callback();
			deferIdRef.current = defer(loop);
		}

		loop();
	}, [callback]);

	const stopLoop = useCallback(() => {
		if (deferIdRef.current !== null) {
			cancelDefer(deferIdRef.current);
			deferIdRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (deferIdRef.current) {
			stopLoop();
			runLoop();
		}
	}, [runLoop, stopLoop]);

	useEffect(
		() => () => {
			if (deferIdRef.current !== null) {
				cancelDefer(deferIdRef.current);
			}
		},
		[]
	);

	return [runLoop, stopLoop];
}

interface SelectionHooks {
	getSelection: () => InputSelection;
	getLastSelection: () => InputSelection;
	setSelection: (selection: InputSelection) => void;
}

function useSelection(inputRef: RefObject<HTMLElement | null>, isMasked: boolean): SelectionHooks {
	const selectionRef = useRef<InputSelection>({ start: 0, end: 0, length: 0 });
	const getInputElement = useInputElement(inputRef);

	const getSelection = useCallback((): InputSelection => {
		const input = getInputElement();
		if (!input) {
			return { start: 0, end: 0, length: 0 };
		}
		return getInputSelection(input);
	}, [getInputElement]);

	const getLastSelection = useCallback((): InputSelection => selectionRef.current, []);

	const setSelection = useCallback(
		(selection: InputSelection): void => {
			const input = getInputElement();

			// Don't change selection on unfocused input
			// because Safari sets focus on selection change (#154)
			if (!input || !isInputFocused(input)) {
				return;
			}

			setInputSelection(input, selection.start, selection.end);

			// Use actual selection in case the requested one was out of range
			selectionRef.current = getSelection();
		},
		[getInputElement, getSelection]
	);

	const selectionLoop = useCallback(() => {
		selectionRef.current = getSelection();
	}, [getSelection]);
	const [runSelectionLoop, stopSelectionLoop] = useDeferLoop(selectionLoop);

	useLayoutEffect(() => {
		if (!isMasked) {
			return;
		}

		const input = getInputElement();
		if (!input) {
			return;
		}

		input.addEventListener('focus', runSelectionLoop);
		input.addEventListener('blur', stopSelectionLoop);

		if (isInputFocused(input)) {
			runSelectionLoop();
		}

		return () => {
			input.removeEventListener('focus', runSelectionLoop);
			input.removeEventListener('blur', stopSelectionLoop);
			stopSelectionLoop();
		};
	});

	return { getSelection, getLastSelection, setSelection };
}

interface ValueHooks {
	getValue: () => string;
	getLastValue: () => string;
	setValue: (newValue: string) => void;
}

function useValue(inputRef: RefObject<HTMLElement | null>, initialValue: string): ValueHooks {
	const getInputElement = useInputElement(inputRef);
	const valueRef = useRef<string>(initialValue);

	const getValue = useCallback((): string => {
		const input = getInputElement();
		return input?.value || '';
	}, [getInputElement]);

	const getLastValue = useCallback((): string => valueRef.current, []);

	const setValue = useCallback(
		(newValue: string): void => {
			valueRef.current = newValue;

			const input = getInputElement();
			if (input) {
				input.value = newValue;
			}
		},
		[getInputElement]
	);

	return {
		getValue,
		getLastValue,
		setValue
	};
}

export interface InputState {
	value: string;
	selection: InputSelection;
}

export interface InputStateHooks {
	inputRef: RefObject<HTMLElement | null>;
	getInputState: () => InputState;
	getLastInputState: () => InputState;
	setInputState: (state: InputState) => void;
}

export function useInputState(initialValue: string, isMasked: boolean): InputStateHooks {
	const inputRef = useRef<HTMLElement>(null);
	const { getSelection, getLastSelection, setSelection } = useSelection(inputRef, isMasked);
	const { getValue, getLastValue, setValue } = useValue(inputRef, initialValue);

	function getLastInputState(): InputState {
		return {
			value: getLastValue(),
			selection: getLastSelection()
		};
	}

	function getInputState(): InputState {
		return {
			value: getValue(),
			selection: getSelection()
		};
	}

	function setInputState({ value, selection }: InputState): void {
		setValue(value);
		setSelection(selection);
	}

	return {
		inputRef,
		getInputState,
		getLastInputState,
		setInputState
	};
}

export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T>(value);
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}
