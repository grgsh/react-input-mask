import invariant from "invariant";
import warning from "warning";
import { ReactElement } from "react";

import { CONTROLLED_PROPS } from "./constants";
import { type Mask } from "./utils/parse-mask";

export interface PropsWithMask {
  mask?: Mask;
  maskPlaceholder?: string | null;
  maxLength?: number;
  [key: string]: any;
}

export function validateMaxLength(props: PropsWithMask): void {
  warning(
    !props.maxLength || !props.mask,
    "react-input-mask: maxLength property shouldn't be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length.",
  );
}

export function validateMaskPlaceholder(props: PropsWithMask): void {
  const { mask, maskPlaceholder } = props;

  invariant(
    !mask ||
      !maskPlaceholder ||
      maskPlaceholder.length === 1 ||
      (typeof mask === "string" && maskPlaceholder.length === mask.length) ||
      (Array.isArray(mask) && maskPlaceholder.length === mask.length),
    "react-input-mask: maskPlaceholder should either be a single character or have the same length as the mask:\\n" +
      `mask: ${mask}\\n` +
      `maskPlaceholder: ${maskPlaceholder}`,
  );
}

export function validateChildren(
  props: PropsWithMask,
  inputElement: ReactElement,
): void {
  const conflictProps = CONTROLLED_PROPS.filter(
    (propId) =>
      inputElement?.props?.[propId] != null &&
      inputElement?.props?.[propId] !== props[propId],
  );

  invariant(
    !conflictProps.length,
    `react-input-mask: the following props should be passed to the InputMask component, not to children: ${conflictProps.join(
      ",",
    )}`,
  );
}
