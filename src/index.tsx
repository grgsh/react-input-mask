import React, { useLayoutEffect, forwardRef, FocusEvent, MouseEvent, ChangeEvent } from 'react';
import { useInputState, useInputElement, usePrevious, type InputState } from './hooks';
import {
	validateMaxLength,
	//   validateChildren,
	validateMaskPlaceholder,
	validateChildren
} from './validate-props';
import { defer } from './utils/defer';
import { isInputFocused, type InputSelection } from './utils/input';
import { isFunction, toString, getElementDocument } from './utils/helpers';
import MaskUtils from './utils/mask';
import { ForwardedChild } from './forward-ref-wrapper';

export type Selection = InputSelection;

export interface BeforeMaskedStateChangeStates {
	previousState?: InputState;
	currentState?: InputState;
	nextState: InputState;
}

export type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> & {
	/**
	 * Mask string. Format characters are:
	 * * `9`: `0-9`
	 * * `a`: `A-Z, a-z`
	 * * `\*`: `A-Z, a-z, 0-9`
	 *
	 * Any character can be escaped with backslash, which usually will appear as double backslash in JS strings.
	 * For example, German phone mask with unremoveable prefix +49 will look like `mask="+4\\9 99 999 99"` or `mask={"+4\\\\9 99 999 99"}`
	 */
	mask?: string | Array<string | RegExp>;
	/**
	 * Character to cover unfilled editable parts of mask. Default character is "_". If set to null, unfilled parts will be empty, like in ordinary input.
	 */
	maskChar?: string | null | undefined;
	maskPlaceholder?: string | null | undefined;
	/**
	 * Show mask even in empty input without focus.
	 */
	alwaysShowMask?: boolean | undefined;
	/**
	 * Use inputRef instead of ref if you need input node to manage focus, selection, etc.
	 */
	inputRef?: React.Ref<HTMLInputElement> | undefined;
	/**
	 * In case you need to implement more complex masking behavior, you can provide
	 * beforeMaskedStateChange function to change masked value and cursor position
	 * before it will be applied to the input.
	 *
	 * * previousState: Input state before change. Only defined on change event.
	 * * currentState: Current raw input state. Not defined during component render.
	 * * nextState: Input state with applied mask. Contains value and selection fields.
	 */
	beforeMaskedStateChange?(states: BeforeMaskedStateChangeStates): InputState;

	children?: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>; // | ((inputProps: any) => React.ReactNode);
	render?: (inputProps: React.InputHTMLAttributes<HTMLInputElement>) => React.ReactElement;
};

// Legacy interface name for backward compatibility
export interface InputMaskProps extends Props {}

// eslint-disable-next-line prefer-arrow-callback
const InputMask = forwardRef<HTMLInputElement, Props>((props, forwardedRef) => {
	const {
		alwaysShowMask = false,
		children,
		render,
		mask,
		maskPlaceholder = '_',
		beforeMaskedStateChange,
		...restProps
	} = props;

	console.log('🚀 Change detected!', {
		props,
		timestamp: new Date().toISOString()
	});

	validateMaxLength(props);
	validateMaskPlaceholder(props);

	const maskUtils = new MaskUtils({ mask, maskPlaceholder });

	const isMasked = !!mask;
	const isEditable = !restProps.disabled && !restProps.readOnly;
	const isControlled = props.value !== null && props.value !== undefined;
	const previousIsMasked = usePrevious(isMasked);
	const initialValue = toString((isControlled ? props.value : props.defaultValue) || '');

	const { inputRef, getInputState, setInputState, getLastInputState } = useInputState(initialValue, isMasked);
	const getInputElement = useInputElement(inputRef);

	function onChange(event: ChangeEvent<HTMLInputElement>): void {
		const currentState = getInputState();
		const previousState = getLastInputState();
		let newInputState: InputState = maskUtils.processChange(currentState, previousState);

		if (beforeMaskedStateChange) {
			newInputState = beforeMaskedStateChange({
				currentState,
				previousState,
				nextState: newInputState
			});
		}

		setInputState(newInputState);

		if (props.onChange) {
			props.onChange(event);
		}
	}

	function onFocus(event: FocusEvent<HTMLInputElement>): void {
		// If autoFocus property is set, focus event fires before the ref handler gets called
		(inputRef as any).current = event.target as HTMLElement;

		const currentValue = getInputState().value;

		if (isMasked && !maskUtils.isValueFilled(currentValue)) {
			let newValue = maskUtils.formatValue(currentValue);
			let newSelection = maskUtils.getDefaultSelectionForValue(newValue);
			let newInputState: InputState = {
				value: newValue,
				selection: newSelection
			};

			if (beforeMaskedStateChange) {
				newInputState = beforeMaskedStateChange({
					currentState: getInputState(),
					nextState: newInputState
				});
				newValue = newInputState.value;
				newSelection = newInputState.selection || {
					start: 0,
					end: 0,
					length: 0
				};
			}

			setInputState(newInputState);

			if (newValue !== currentValue && props.onChange) {
				props.onChange(event);
			}

			// Chrome resets selection after focus event,
			// so we want to restore it later
			defer(() => {
				setInputState(getLastInputState());
			});
		}

		if (props.onFocus) {
			props.onFocus(event);
		}
	}

	function onBlur(event: FocusEvent<HTMLInputElement>): void {
		const currentValue = getInputState().value;
		const lastValue = getLastInputState().value;

		if (isMasked && !alwaysShowMask && maskUtils.isValueEmpty(lastValue)) {
			let newValue = '';
			let newInputState: InputState = {
				value: newValue,
				selection: { start: 0, end: 0, length: 0 } // TODO: Check this - originally this was {start: null, end: null}
			};

			if (beforeMaskedStateChange) {
				newInputState = beforeMaskedStateChange({
					currentState: getInputState(),
					nextState: newInputState
				});
				newValue = newInputState.value;
			}

			setInputState(newInputState);

			if (newValue !== currentValue && props.onChange) {
				props.onChange(event);
			}
		}

		if (props.onBlur) {
			props.onBlur(event);
		}
	}

	// Tiny unintentional mouse movements can break cursor
	// position on focus, so we have to restore it in that case
	//
	// https://github.com/sanniassin/react-input-mask/issues/108
	function onMouseDown(event: MouseEvent<HTMLInputElement>): void {
		const input = getInputElement();
		if (!input) return; // TODO: Check - originally this check wasn't here
		const { value } = getInputState();
		const inputDocument = getElementDocument(input);

		if (!isInputFocused(input) && !maskUtils.isValueFilled(value)) {
			const mouseDownX = event.clientX;
			const mouseDownY = event.clientY;
			const mouseDownTime = new Date().getTime();

			const mouseUpHandler = (mouseUpEvent: Event): void => {
				inputDocument?.removeEventListener('mouseup', mouseUpHandler);

				if (!isInputFocused(input)) {
					return;
				}

				const deltaX = Math.abs((mouseUpEvent as any).clientX - mouseDownX);
				const deltaY = Math.abs((mouseUpEvent as any).clientY - mouseDownY);
				const axisDelta = Math.max(deltaX, deltaY);
				const timeDelta = new Date().getTime() - mouseDownTime;

				if ((axisDelta <= 10 && timeDelta <= 200) || (axisDelta <= 5 && timeDelta <= 300)) {
					const lastState = getLastInputState();
					const newSelection = maskUtils.getDefaultSelectionForValue(lastState.value);
					const newState: InputState = {
						...lastState,
						selection: newSelection
					};
					setInputState(newState);
				}
			};

			inputDocument?.addEventListener('mouseup', mouseUpHandler);
		}

		if (props.onMouseDown) {
			props.onMouseDown(event);
		}
	}

	// For controlled inputs we want to provide properly formatted
	// value prop
	if (isMasked && isControlled) {
		const input = getInputElement();
		const isFocused = input && isInputFocused(input);
		let newValue =
			isFocused || alwaysShowMask || props.value
				? maskUtils.formatValue(toString(props.value || ''))
				: toString(props.value || '');

		if (beforeMaskedStateChange) {
			newValue = beforeMaskedStateChange({
				nextState: {
					value: toString(newValue),
					selection: { start: 0, end: 0, length: 0 }
				}
			}).value;
		}

		setInputState({
			...getLastInputState(),
			value: toString(newValue)
		});
	}

	const lastState = getLastInputState();
	const lastSelection = lastState.selection;
	const lastValue = lastState.value;

	useLayoutEffect(() => {
		if (!isMasked) return;

		const input = getInputElement();
		if (!input) return;

		const isFocused = isInputFocused(input);
		const previousSelection = lastSelection;
		const currentState = getInputState();
		let newInputState: InputState = { ...currentState };

		// Update value for uncontrolled inputs to make sure
		// it's always in sync with mask props
		if (!isControlled) {
			const currentValue = currentState.value;
			const formattedValue = maskUtils.formatValue(currentValue);
			const isValueEmpty = maskUtils.isValueEmpty(formattedValue);
			const shouldFormatValue = !isValueEmpty || isFocused || alwaysShowMask;
			if (shouldFormatValue) {
				newInputState.value = formattedValue;
			} else if (isValueEmpty && !isFocused) {
				newInputState.value = '';
			}
		}

		if (isFocused && !previousIsMasked) {
			// Adjust selection if input got masked while being focused
			newInputState.selection = maskUtils.getDefaultSelectionForValue(newInputState.value);
		} else if (isControlled && isFocused && previousSelection) {
			// Restore cursor position if value has changed outside change event
			if (previousSelection.start !== null && previousSelection.end !== null) {
				newInputState.selection = previousSelection;
			}
		}

		if (beforeMaskedStateChange) {
			newInputState = beforeMaskedStateChange({
				currentState,
				nextState: newInputState
			});
		}

		setInputState(newInputState);
	});

	const refCallback = (node: HTMLInputElement | null): void => {
		(inputRef as any).current = node;

		// if a ref callback is passed to InputMask

		if (isFunction(forwardedRef)) {
			(forwardedRef as (instance: HTMLInputElement | null) => void)(node);
		} else if (forwardedRef !== null && typeof forwardedRef === 'object') {
			(forwardedRef as React.RefObject<HTMLInputElement | null>).current = node;
		}
	};

	const inputProps = {
		...restProps,
		onFocus,
		onBlur,
		onChange: isMasked && isEditable ? onChange : props.onChange,
		onMouseDown: isMasked && isEditable ? onMouseDown : props.onMouseDown,
		value: isMasked && isControlled ? lastValue : props.value
	};

	if (children) {
		validateChildren(props, children);

		// {@link https://stackoverflow.com/q/63149840/327074}
		const onlyChild = React.Children.only(children);
		return <ForwardedChild element={onlyChild} {...inputProps} ref={refCallback} />;
	}
	if (render) {
		const element = render(inputProps);
		return <ForwardedChild element={element} {...inputProps} ref={refCallback} />;
	}

	return <input ref={refCallback} {...inputProps} />;
});

InputMask.displayName = 'InputMask';

export default InputMask;
