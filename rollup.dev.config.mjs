import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
// eslint-disable-next-line import/no-extraneous-dependencies
import typescript from '@rollup/plugin-typescript';
import protoToAssign from './rollup.proto-to-assign.plugin.mjs';

const input = './src/index.tsx';

const external = ['react', 'react-dom'];
const plugins = [
	typescript({
		tsconfig: './tsconfig.build.json'
	}),
	babel({
		exclude: 'node_modules/**',
		extensions: ['.js', '.jsx', '.ts', '.tsx']
	}),
	nodeResolve({
		extensions: ['.js', '.jsx', '.ts', '.tsx']
	}),
	commonjs(),
	protoToAssign()
];

// Development-only build configuration for faster watch mode
export default [
	{
		input,
		output: { file: 'lib/react-input-mask.development.js', format: 'cjs' },
		external,
		plugins: [
			...plugins,
			replace({
				'process.env.NODE_ENV': '"development"'
			})
		]
	},

	// ES Module builds for modern bundlers
	{
		input,
		output: { file: 'lib/react-input-mask.esm.js', format: 'es' },
		external,
		plugins
	}
];
