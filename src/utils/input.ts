export interface InputSelection {
  start: number;
  end: number;
  length: number;
}

export function setInputSelection(
  input: HTMLInputElement,
  start: number,
  end?: number,
): void {
  if (end === undefined) {
    end = start;
  }
  input.setSelectionRange(start, end);
}

export function getInputSelection(input: HTMLInputElement): InputSelection {
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;

  return {
    start,
    end,
    length: end - start,
  };
}

export function isInputFocused(input: HTMLInputElement): boolean {
  const inputDocument = input.ownerDocument;
  return inputDocument.hasFocus() && inputDocument.activeElement === input;
}
