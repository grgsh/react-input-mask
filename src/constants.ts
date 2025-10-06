export const CONTROLLED_PROPS = [
  "disabled",
  "onBlur",
  "onChange",
  "onFocus",
  "onMouseDown",
  "readOnly",
  "value",
] as const;

export const defaultFormatChars: Record<string, RegExp> = {
  9: /[0-9]/,
  a: /[A-Za-z]/,
  "*": /[A-Za-z0-9]/,
};
