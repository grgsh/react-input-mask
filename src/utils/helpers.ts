// Element's window may differ from the one within React instance
// if element rendered within iframe.
// See https://github.com/sanniassin/react-input-mask/issues/182
export function getElementDocument(element: Element | null | undefined): Document | null | undefined {
	return element?.ownerDocument;
}

export function getElementWindow(element: Element | null | undefined): Window | null | undefined {
	return getElementDocument(element)?.defaultView;
}

export function isDOMElement(element: unknown): element is HTMLElement {
	const elementWindow = getElementWindow(element as Element);
	return !!elementWindow && element instanceof (elementWindow as any).HTMLElement;
}

export function isFunction(value: unknown): value is Function {
	return typeof value === 'function';
}

export function findLastIndex<T>(array: T[], predicate: (value: T, index: number) => boolean): number {
	for (let i = array.length - 1; i >= 0; i--) {
		const x = array[i];
		if (predicate(x, i)) {
			return i;
		}
	}
	return -1;
}

export function repeat(string: string, n = 1): string {
	let result = '';
	for (let i = 0; i < n; i++) {
		result += string;
	}
	return result;
}

export function toString(value: unknown): string {
	return `${value}`;
}
