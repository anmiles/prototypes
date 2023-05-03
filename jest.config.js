module.exports = {
	clearMocks : true,

	roots     : [ '<rootDir>/src' ],
	testMatch : [ '<rootDir>/src/**/__tests__/*.test.ts' ],
	collectCoverageFrom : [
		'<rootDir>/src/**/*.js',

		'!**/node_modules/**',
		'!**/__tests__/**',

		'!<rootDir>/coverage/**',
	],
};
