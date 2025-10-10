import { defaultFormatChars } from '../constants';

export type MaskChar = string | RegExp;
export type Mask = string | Array<MaskChar>;

export interface ParsedMask {
	maskPlaceholder: string | null;
	mask: Array<MaskChar> | null;
	prefix: string | null;
	lastEditablePosition: number | null;
	permanents: number[];
}

interface ParseMaskOptions {
	mask?: Mask;
	maskPlaceholder?: string | null;
}

const parseMask = ({ mask, maskPlaceholder }: ParseMaskOptions): ParsedMask => {
	const permanents: number[] = [];

	if (!mask) {
		return {
			maskPlaceholder: null,
			mask: null,
			prefix: null,
			lastEditablePosition: null,
			permanents: []
		};
	}

	let processedMask: Array<MaskChar>;

	if (typeof mask === 'string') {
		let isPermanent = false;
		let parsedMaskString = '';
		mask.split('').forEach(character => {
			if (!isPermanent && character === '\\') {
				isPermanent = true;
			} else {
				if (isPermanent || !defaultFormatChars[character]) {
					permanents.push(parsedMaskString.length);
				}
				parsedMaskString += character;
				isPermanent = false;
			}
		});

		processedMask = parsedMaskString.split('').map((character, index) => {
			if (permanents.indexOf(index) === -1) {
				return defaultFormatChars[character];
			}
			return character;
		});
	} else {
		processedMask = mask;
		mask.forEach((character, index) => {
			if (typeof character === 'string') {
				permanents.push(index);
			}
		});
	}

	let processedMaskPlaceholder: string | null = maskPlaceholder || null;

	if (processedMaskPlaceholder) {
		if (processedMaskPlaceholder.length === 1) {
			processedMaskPlaceholder = processedMask
				.map((character, index) => {
					if (permanents.indexOf(index) !== -1) {
						return character as string;
					}
					return maskPlaceholder as string;
				})
				.join('');
		} else {
			const placeholderArray = processedMaskPlaceholder.split('');
			permanents.forEach(position => {
				placeholderArray[position] = processedMask[position] as string;
			});
			processedMaskPlaceholder = placeholderArray.join('');
		}
	}

	const prefix = permanents
		.filter((position, index) => position === index)
		.map(position => processedMask[position] as string)
		.join('');

	let lastEditablePosition = processedMask.length - 1;
	while (permanents.indexOf(lastEditablePosition) !== -1) {
		lastEditablePosition--;
	}

	return {
		maskPlaceholder: processedMaskPlaceholder,
		prefix,
		mask: processedMask,
		lastEditablePosition,
		permanents
	};
};

export default parseMask;
