import React, {
  useLayoutEffect,
  forwardRef,
  ReactElement,
  InputHTMLAttributes,
  FocusEvent,
  MouseEvent,
  ChangeEvent,
} from "react";

import {
  useInputState,
  useInputElement,
  usePrevious,
  type InputState,
} from "./hooks.ts";
import {
  validateMaxLength,
  validateChildren,
  validateMaskPlaceholder,
} from "./validate-props.ts";

import { defer } from "./utils/defer.ts";
import { isInputFocused, type InputSelection } from "./utils/input.ts";
import { isFunction, toString, getElementDocument } from "./utils/helpers.ts";
import MaskUtils from "./utils/mask.ts";
import { type Mask } from "./utils/parse-mask.ts";

export interface BeforeMaskedStateChangeStates {
  currentState?: InputState;
  previousState?: InputState;
  nextState: InputState;
}

export interface BeforeMaskedStateChangeResult {
  value: string;
  selection: InputSelection;
}

export interface InputMaskProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "onFocus" | "onBlur" | "onMouseDown"
  > {
  alwaysShowMask?: boolean;
  beforeMaskedStateChange?: (
    states: BeforeMaskedStateChangeStates,
  ) => BeforeMaskedStateChangeResult;
  children?: ReactElement;
  mask?: Mask;
  maskPlaceholder?: string | null;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onMouseDown?: (event: MouseEvent<HTMLInputElement>) => void;
}

// eslint-disable-next-line prefer-arrow-callback
const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(
  (props, forwardedRef) => {
    const {
      alwaysShowMask = false,
      children,
      mask,
      maskPlaceholder = "_",
      beforeMaskedStateChange,
      ...restProps
    } = props;

    validateMaxLength(props);
    validateMaskPlaceholder(props);

    const maskUtils = new MaskUtils({ mask, maskPlaceholder });

    const isMasked = !!mask;
    const isEditable = !restProps.disabled && !restProps.readOnly;
    const isControlled = props.value !== null && props.value !== undefined;
    const previousIsMasked = usePrevious(isMasked);
    const initialValue = toString(
      (isControlled ? props.value : props.defaultValue) || "",
    );

    const { inputRef, getInputState, setInputState, getLastInputState } =
      useInputState(initialValue, isMasked);
    const getInputElement = useInputElement(inputRef);

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
      const currentState = getInputState();
      const previousState = getLastInputState();
      let newInputState = maskUtils.processChange(currentState, previousState);

      if (beforeMaskedStateChange) {
        const modifiedState = beforeMaskedStateChange({
          currentState,
          previousState,
          nextState: {
            value: newInputState.value,
            selection: newInputState.selection,
          },
        });
        newInputState = {
          ...newInputState,
          value: modifiedState.value,
          selection: modifiedState.selection,
        };
      }

      setInputState({
        value: newInputState.value,
        selection: newInputState.selection,
      });

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
          selection: newSelection,
        };

        if (beforeMaskedStateChange) {
          const modifiedState = beforeMaskedStateChange({
            currentState: getInputState(),
            nextState: newInputState,
          });
          newValue = modifiedState.value;
          newSelection = modifiedState.selection;
          newInputState = { value: newValue, selection: newSelection };
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
        let newValue = "";
        let newInputState: InputState = {
          value: newValue,
          selection: { start: 0, end: 0, length: 0 },
        };

        if (beforeMaskedStateChange) {
          const modifiedState = beforeMaskedStateChange({
            currentState: getInputState(),
            nextState: newInputState,
          });
          newValue = modifiedState.value;
          newInputState = {
            value: newValue,
            selection: modifiedState.selection,
          };
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
      if (!input) {
        return;
      }
      const { value } = getInputState();
      const inputDocument = getElementDocument(input);

      if (!isInputFocused(input) && !maskUtils.isValueFilled(value)) {
        const mouseDownX = event.clientX;
        const mouseDownY = event.clientY;
        const mouseDownTime = new Date().getTime();

        const mouseUpHandler = (mouseUpEvent: Event): void => {
          inputDocument?.removeEventListener("mouseup", mouseUpHandler);

          if (!isInputFocused(input)) {
            return;
          }

          const deltaX = Math.abs((mouseUpEvent as any).clientX - mouseDownX);
          const deltaY = Math.abs((mouseUpEvent as any).clientY - mouseDownY);
          const axisDelta = Math.max(deltaX, deltaY);
          const timeDelta = new Date().getTime() - mouseDownTime;

          if (
            (axisDelta <= 10 && timeDelta <= 200) ||
            (axisDelta <= 5 && timeDelta <= 300)
          ) {
            const lastState = getLastInputState();
            const newSelection = maskUtils.getDefaultSelectionForValue(
              lastState.value,
            );
            const newState: InputState = {
              ...lastState,
              selection: newSelection,
            };
            setInputState(newState);
          }
        };

        inputDocument?.addEventListener("mouseup", mouseUpHandler);
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
          ? maskUtils.formatValue(toString(props.value || ""))
          : toString(props.value || "");

      if (beforeMaskedStateChange) {
        const modifiedState = beforeMaskedStateChange({
          nextState: {
            value: toString(newValue),
            selection: { start: 0, end: 0, length: 0 },
          },
        });
        newValue = modifiedState.value;
      }

      setInputState({
        ...getLastInputState(),
        value: toString(newValue),
      });
    }

    const lastState = getLastInputState();
    const lastSelection = lastState.selection;
    const lastValue = lastState.value;

    useLayoutEffect(() => {
      if (!isMasked) {
        return;
      }

      const input = getInputElement();
      if (!input) {
        return;
      }
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
          newInputState.value = "";
        }
      }

      if (isFocused && !previousIsMasked) {
        // Adjust selection if input got masked while being focused
        newInputState.selection = maskUtils.getDefaultSelectionForValue(
          newInputState.value,
        );
      } else if (isControlled && isFocused && previousSelection) {
        // Restore cursor position if value has changed outside change event
        if (
          previousSelection.start !== null &&
          previousSelection.end !== null
        ) {
          newInputState.selection = previousSelection;
        }
      }

      if (beforeMaskedStateChange) {
        const modifiedState = beforeMaskedStateChange({
          currentState,
          nextState: newInputState,
        });
        newInputState = {
          value: modifiedState.value,
          selection: modifiedState.selection,
        };
      }

      setInputState(newInputState);
    });

    const refCallback = (node: HTMLInputElement | null): void => {
      (inputRef as any).current = node;

      // if a ref callback is passed to InputMask
      if (isFunction(forwardedRef)) {
        (forwardedRef as (instance: HTMLInputElement | null) => void)(node);
      } else if (forwardedRef !== null && typeof forwardedRef === "object") {
        (
          forwardedRef as React.MutableRefObject<HTMLInputElement | null>
        ).current = node;
      }
    };

    const inputProps = {
      ...restProps,
      onFocus,
      onBlur,
      onChange: isMasked && isEditable ? onChange : props.onChange,
      onMouseDown: isMasked && isEditable ? onMouseDown : props.onMouseDown,
      value: isMasked && isControlled ? lastValue : props.value,
    };

    if (children) {
      validateChildren(props, children);

      // {@link https://stackoverflow.com/q/63149840/327074}
      const onlyChild = React.Children.only(children);
      return React.cloneElement(onlyChild, { ...inputProps, ref: refCallback });
    }

    return <input ref={refCallback} {...inputProps} />;
  },
);

InputMask.displayName = "InputMask";

export default InputMask;
