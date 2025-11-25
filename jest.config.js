module.exports = {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
	},
	testMatch: ['<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)'],
	collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts']
};
