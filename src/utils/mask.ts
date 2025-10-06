/* eslint no-use-before-define: ["error", { functions: false }] */
import { findLastIndex, repeat } from "./helpers";
import parseMask, { type ParsedMask, type Mask } from "./parse-mask";
import { type InputSelection } from "./input";

export interface MaskOptions {
  mask?: Mask;
  maskPlaceholder?: string | null;
}

export interface InputState {
  value: string;
  selection: InputSelection;
}

export interface ProcessChangeResult {
  value: string;
  enteredString: string;
  selection: InputSelection;
}

export default class MaskUtils {
  maskOptions: ParsedMask;

  constructor(options: MaskOptions) {
    this.maskOptions = parseMask(options);
  }

  isCharacterAllowedAtPosition = (
    character: string,
    position: number,
  ): boolean => {
    const { maskPlaceholder } = this.maskOptions;

    if (this.isCharacterFillingPosition(character, position)) {
      return true;
    }

    if (!maskPlaceholder) {
      return false;
    }

    return maskPlaceholder[position] === character;
  };

  isCharacterFillingPosition = (
    character: string,
    position: number,
  ): boolean => {
    const { mask } = this.maskOptions;

    if (!character || !mask || position >= mask.length) {
      return false;
    }

    if (!this.isPositionEditable(position)) {
      return mask[position] === character;
    }

    const charRule = mask[position];
    return new RegExp(charRule).test(character);
  };

  isPositionEditable = (position: number): boolean => {
    const { mask, permanents } = this.maskOptions;
    return !!(
      mask &&
      position < mask.length &&
      permanents.indexOf(position) === -1
    );
  };

  isValueEmpty = (value: string): boolean =>
    value
      .split("")
      .every(
        (character, position) =>
          !this.isPositionEditable(position) ||
          !this.isCharacterFillingPosition(character, position),
      );

  isValueFilled = (value: string): boolean => {
    const { lastEditablePosition } = this.maskOptions;
    return (
      lastEditablePosition !== null &&
      this.getFilledLength(value) === lastEditablePosition + 1
    );
  };

  getDefaultSelectionForValue = (value: string): InputSelection => {
    const filledLength = this.getFilledLength(value);
    const cursorPosition = this.getRightEditablePosition(filledLength);
    return { start: cursorPosition || 0, end: cursorPosition || 0, length: 0 };
  };

  getFilledLength = (value: string): number => {
    const characters = value.split("");
    const lastFilledIndex = findLastIndex(
      characters,
      (character, position) =>
        this.isPositionEditable(position) &&
        this.isCharacterFillingPosition(character, position),
    );
    return lastFilledIndex + 1;
  };

  getStringFillingLengthAtPosition = (
    string: string,
    position: number,
  ): number => {
    const characters = string.split("");
    const insertedValue = characters.reduce(
      (value, character) =>
        this.insertCharacterAtPosition(value, character, value.length),
      repeat(" ", position),
    );

    return insertedValue.length - position;
  };

  getLeftEditablePosition = (position: number): number | null => {
    for (let i = position; i >= 0; i--) {
      if (this.isPositionEditable(i)) {
        return i;
      }
    }
    return null;
  };

  getRightEditablePosition = (position: number): number | null => {
    const { mask } = this.maskOptions;
    if (!mask) return null;

    for (let i = position; i < mask.length; i++) {
      if (this.isPositionEditable(i)) {
        return i;
      }
    }
    return null;
  };

  formatValue = (value: string): string => {
    const { maskPlaceholder, mask } = this.maskOptions;

    if (!mask) return value;

    if (!maskPlaceholder) {
      value = this.insertStringAtPosition("", value, 0);

      while (
        value.length < mask.length &&
        !this.isPositionEditable(value.length)
      ) {
        value += mask[value.length] as string;
      }

      return value;
    }

    return this.insertStringAtPosition(maskPlaceholder, value, 0);
  };

  clearRange = (value: string, start: number, len: number): string => {
    if (!len) {
      return value;
    }

    const end = start + len;
    const { maskPlaceholder, mask } = this.maskOptions;

    if (!mask) return value;

    const clearedValue = value
      .split("")
      .map((character, i) => {
        const isEditable = this.isPositionEditable(i);

        if (!maskPlaceholder && i >= end && !isEditable) {
          return "";
        }
        if (i < start || i >= end) {
          return character;
        }
        if (!isEditable) {
          return mask[i] as string;
        }
        if (maskPlaceholder) {
          return maskPlaceholder[i];
        }
        return "";
      })
      .join("");

    return this.formatValue(clearedValue);
  };

  insertCharacterAtPosition = (
    value: string,
    character: string,
    position: number,
  ): string => {
    const { mask, maskPlaceholder } = this.maskOptions;
    if (!mask || position >= mask.length) {
      return value;
    }

    const isAllowed = this.isCharacterAllowedAtPosition(character, position);
    const isEditable = this.isPositionEditable(position);
    const nextEditablePosition = this.getRightEditablePosition(position);
    const isNextPlaceholder =
      maskPlaceholder && nextEditablePosition
        ? character === maskPlaceholder[nextEditablePosition]
        : null;
    const valueBefore = value.slice(0, position);

    if (isAllowed || !isEditable) {
      const insertedCharacter = isAllowed
        ? character
        : (mask[position] as string);
      value = valueBefore + insertedCharacter;
    }

    if (!isAllowed && !isEditable && !isNextPlaceholder) {
      value = this.insertCharacterAtPosition(value, character, position + 1);
    }

    return value;
  };

  insertStringAtPosition = (
    value: string,
    string: string,
    position: number,
  ): string => {
    const { mask, maskPlaceholder } = this.maskOptions;
    if (!string || !mask || position >= mask.length) {
      return value;
    }

    const characters = string.split("");
    const isFixedLength = this.isValueFilled(value) || !!maskPlaceholder;
    const valueAfter = value.slice(position);

    value = characters.reduce(
      (value, character) =>
        this.insertCharacterAtPosition(value, character, value.length),
      value.slice(0, position),
    );

    if (isFixedLength) {
      value += valueAfter.slice(value.length - position);
    } else if (this.isValueFilled(value)) {
      value += mask
        .slice(value.length)
        .map((char) => char as string)
        .join("");
    } else {
      const editableCharactersAfter = valueAfter
        .split("")
        .filter((character, i) => this.isPositionEditable(position + i));
      value = editableCharactersAfter.reduce((value, character) => {
        const nextEditablePosition = this.getRightEditablePosition(
          value.length,
        );
        if (nextEditablePosition === null) {
          return value;
        }

        if (!this.isPositionEditable(value.length)) {
          value += mask
            .slice(value.length, nextEditablePosition)
            .map((char) => char as string)
            .join("");
        }

        return this.insertCharacterAtPosition(value, character, value.length);
      }, value);
    }

    return value;
  };

  processChange = (
    currentState: InputState,
    previousState: InputState,
  ): ProcessChangeResult => {
    const { mask, prefix, lastEditablePosition } = this.maskOptions;
    const { value, selection } = currentState;
    const previousValue = previousState.value;
    const previousSelection = previousState.selection;

    if (!mask || prefix === null || lastEditablePosition === null) {
      return {
        value,
        enteredString: "",
        selection: { start: 0, end: 0, length: 0 },
      };
    }

    let newValue = value;
    let enteredString = "";
    let formattedEnteredStringLength = 0;
    let removedLength = 0;
    let cursorPosition = Math.min(previousSelection.start, selection.start);

    if (selection.end > previousSelection.start) {
      enteredString = newValue.slice(previousSelection.start, selection.end);
      formattedEnteredStringLength = this.getStringFillingLengthAtPosition(
        enteredString,
        cursorPosition,
      );
      if (!formattedEnteredStringLength) {
        removedLength = 0;
      } else {
        removedLength = previousSelection.length;
      }
    } else if (newValue.length < previousValue.length) {
      removedLength = previousValue.length - newValue.length;
    }

    newValue = previousValue;

    if (removedLength) {
      if (removedLength === 1 && !previousSelection.length) {
        const deleteFromRight = previousSelection.start === selection.start;
        cursorPosition = deleteFromRight
          ? this.getRightEditablePosition(selection.start) || selection.start
          : this.getLeftEditablePosition(selection.start) || selection.start;
      }
      newValue = this.clearRange(newValue, cursorPosition, removedLength);
    }

    newValue = this.insertStringAtPosition(
      newValue,
      enteredString,
      cursorPosition,
    );

    cursorPosition += formattedEnteredStringLength;
    if (cursorPosition >= mask.length) {
      cursorPosition = mask.length;
    } else if (
      cursorPosition < prefix.length &&
      !formattedEnteredStringLength
    ) {
      cursorPosition = prefix.length;
    } else if (
      cursorPosition >= prefix.length &&
      cursorPosition < lastEditablePosition &&
      formattedEnteredStringLength
    ) {
      cursorPosition =
        this.getRightEditablePosition(cursorPosition) || cursorPosition;
    }

    newValue = this.formatValue(newValue);

    return {
      value: newValue,
      enteredString,
      selection: { start: cursorPosition, end: cursorPosition, length: 0 },
    };
  };
}
