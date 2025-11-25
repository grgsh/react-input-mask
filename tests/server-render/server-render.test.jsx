import React from 'react';
import { describe, it, expect } from '@jest/globals';
import ReactDOMServer from 'react-dom/server';
import InputElement from '../../index';

describe('Test prerender', () => {
	it('should return a string', () => {
		const result = ReactDOMServer.renderToString(<InputElement value="some" mask="799" />);
		expect(typeof result).toBe('string');
	});
});
