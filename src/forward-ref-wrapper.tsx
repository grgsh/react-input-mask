import React from "react";

// Define the props type
type ForwardRefWrapperProps<P> = {
  element: React.ReactElement<P>;
} & Omit<P, "ref">;

// Define the component type for ForwardedChild
type ForwardedChildType = <P, R = unknown>(
  props: ForwardRefWrapperProps<P> & { ref?: React.Ref<R> },
) => React.ReactElement;

function ForwardRefWrapper<P, R>(
  { element, ...props }: ForwardRefWrapperProps<P>,
  ref: React.Ref<R>,
): React.ReactElement {
  return React.cloneElement(element, { ...props, ref } as any); // casting because ref is not part of P
}

// Use the type for the cast:
const ForwardedChild = React.forwardRef(
  ForwardRefWrapper,
) as ForwardedChildType;

export { ForwardRefWrapper, ForwardedChild };
