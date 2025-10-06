import React, { ReactElement, Component } from "react";

interface Props {
  children: ReactElement;
  [key: string]: any;
}

export default class InputMaskChildrenWrapper extends Component<Props> {
  render(): ReactElement {
    const { children, ...props } = this.props;
    return React.cloneElement(children, props);
  }
}
