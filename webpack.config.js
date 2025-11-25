const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const srcDir = path.resolve(__dirname, './dev');

module.exports = {
	devtool: 'cheap-module-source-map',
	context: srcDir,
	performance: {
		hints: false
	},
	entry: './index.js',
	output: {
		filename: '[name].js'
	},
	resolve: {
		extensions: ['.js', '.jsx', '.ts', '.tsx'],
		modules: ['node_modules', '.']
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx|ts|tsx)$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env', { targets: 'Chrome > 70' }],
							'@babel/preset-react',
							'@babel/preset-typescript'
						]
					}
				},
				exclude: /node_modules/
			}
		]
	},
	devServer: {
		host: '0.0.0.0',
		port: 9000
		// disableHostCheck: true
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'index.html'
		})
	]
};
