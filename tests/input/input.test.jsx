import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../../src/index';

describe('Input component', () => {
	it('renders with mask and placeholder', async () => {
		const user = userEvent.setup();

		render(<Input mask="9999-9999" maskPlaceholder="_" />);

		const input = screen.getByRole('textbox');
		expect(input).toBeInTheDocument();

		await user.click(input); // Focus
		expect(input).toHaveValue('____-____');
	});

	it('accepts user input and formats correctly', async () => {
		const user = userEvent.setup();

		render(<Input mask="9999-9999" maskPlaceholder="_" />);

		const input = screen.getByRole('textbox');

		await user.type(input, '12345678');
		expect(input).toHaveValue('1234-5678');
	});

	it('does not allow non-numeric input for numeric mask', async () => {
		const user = userEvent.setup();

		render(<Input mask="9999-9999" maskPlaceholder="_" />);

		const input = screen.getByRole('textbox');

		await user.type(input, 'abcd');
		expect(input).toHaveValue('____-____');
	});

	it('handles maskPlaceholder=null', async () => {
		const user = userEvent.setup();

		render(<Input mask="9999-9999" maskPlaceholder={null} />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('');

		await user.type(input, '12345678');
		expect(input).toHaveValue('1234-5678');
	});

	it('handles defaultValue', async () => {
		render(<Input mask="9999-9999" defaultValue="12345678" />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('1234-5678');
	});

	it('handles controlled value', async () => {
		const user = userEvent.setup();

		function ControlledInput() {
			const [value, setValue] = React.useState('12345678');
			return <Input mask="9999-9999" value={value} onChange={e => setValue(e.target.value)} />;
		}
		render(<ControlledInput />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('1234-5678');

		await user.clear(input);
		await user.type(input, '87654321', { skipClick: true });
		expect(input).toHaveValue('8765-4321');
	});

	it('fires onChange event', async () => {
		const user = userEvent.setup();

		const handleChange = jest.fn();
		render(<Input mask="9999-9999" onChange={handleChange} />);

		const input = screen.getByRole('textbox');
		await user.type(input, '1234');

		expect(handleChange).toHaveBeenCalled();
	});

	it('formats value on mount', () => {
		render(<Input mask="+7 (999) 999 99 99" defaultValue="74953156454" />);

		const input = screen.getByRole('textbox');

		expect(input).toHaveValue('+7 (495) 315 64 54');
	});

	it('formats value with invalid characters on mount', () => {
		render(<Input mask="+7 (9a9) 999 99 99" defaultValue="749531b6454" />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('+7 (4b6) 454 __ __');
	});

	it('handles array mask', async () => {
		const user = userEvent.setup();

		const letter = /[АВЕКМНОРСТУХ]/i;
		const digit = /[0-9]/;
		const mask = [letter, digit, digit, digit, letter, letter];
		render(<Input mask={mask} defaultValue="А784КТ" />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('А784КТ');

		await user.type(input, '{backspace}');
		expect(input).toHaveValue('А784К_');

		await user.type(input, 'Б');
		expect(input.selectionStart).toBe(6);

		await user.type(input, 'Х');
		expect(input.selectionStart).toBe(6); // No change, as mask is full
	});

	it('handles full length maskPlaceholder', async () => {
		const user = userEvent.setup({ skipClick: true });
		render(<Input mask="99/99/9999" maskPlaceholder="dd/mm/yyyy" defaultValue="12" />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('12/mm/yyyy');

		await user.click(input);
		expect(input.selectionStart).toBe(3);

		await user.type(input, '{backspace}');
		expect(input).toHaveValue('1d/mm/yyyy');

		await user.type(input, '234');
		expect(input).toHaveValue('12/34/yyyy');

		await user.type(input, '7', { initialSelectionStart: 8, initialSelectionEnd: 8 });
		expect(input).toHaveValue('12/34/yy7y');
	});

	it('shows placeholder on focus', async () => {
		const user = userEvent.setup();

		render(<Input mask="+7 (*a9) 999 99 99" />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('');

		await user.click(input);
		expect(input).toHaveValue('+7 (___) ___ __ __');
	});

	it('clears input on blur', async () => {
		const user = userEvent.setup({ skipClick: true });

		render(<Input mask="+7 (*a9) 999 99 99" />);

		const input = screen.getByRole('textbox');

		await user.click(input);
		expect(input).toHaveValue('+7 (___) ___ __ __');

		input.blur();
		expect(input).toHaveValue('');

		await user.click(input);
		await user.type(input, '1');
		expect(input).toHaveValue('+7 (1__) ___ __ __');

		input.blur();
		expect(input).toHaveValue('+7 (1__) ___ __ __');
	});

	it('handles escaped characters in mask', async () => {
		const user = userEvent.setup();

		render(<Input mask={'+4\\9 99 9\\99 99'} maskPlaceholder={null} />);

		const input = screen.getByRole('textbox');

		await user.type(input, '123');
		expect(input).toHaveValue('+49 12 39');

		await user.type(input, '1', { initialSelectionStart: 7, initialSelectionEnd: 7 });
		expect(input).toHaveValue('+49 12 193 ');
		expect(input.selectionStart).toBe(9);

		await user.type(input, '9', { initialSelectionStart: 7, initialSelectionEnd: 8 });
		expect(input).toHaveValue('+49 12 993 ');
		expect(input.selectionStart).toBe(9);
	});

	it('toggles alwaysShowMask', async () => {
		const user = userEvent.setup();

		const { rerender } = render(<Input mask="+7 (999) 999 99 99" alwaysShowMask />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('+7 (___) ___ __ __');

		rerender(<Input mask="+7 (999) 999 99 99" alwaysShowMask={false} />);

		input.blur(); // Lose focus
		expect(input).toHaveValue('');

		await user.click(input); // Focus the input
		expect(input).toHaveValue('+7 (___) ___ __ __');

		rerender(<Input mask="+7 (999) 999 99 99" alwaysShowMask />);
		input.blur(); // Lose focus
		expect(input).toHaveValue('+7 (___) ___ __ __');

		await user.click(input); // Focus the input
		expect(input).toHaveValue('+7 (___) ___ __ __');
	});

	it('formats value in onChange (with maskPlaceholder)', async () => {
		const user = userEvent.setup({ skipClick: true });
		render(<Input mask="**** **** **** ****" />);
		const input = screen.getByRole('textbox');
		await user.click(input); // Initial focus

		// await user.type(input, 'a', { skipClick: true });
		await user.type(input, 'a');
		expect(input).toHaveValue('a___ ____ ____ ____');

		// input.value = 'aaaaa___ ____ ____ ____';
		// input.setSelectionRange(1, 4);
		// await user.type(input, '{enter}');
		await user.type(input, 'aaaa');
		expect(input).toHaveValue('aaaa a___ ____ ____');
	});

	// Add more cases as needed for paste, selection, backspace, etc.
});
