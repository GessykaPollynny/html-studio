module.exports = {
	// Os módulos manipulam o DOM (contenteditable, closest, querySelectorAll),
	// então os testes rodam num DOM simulado.
	testEnvironment: 'jsdom',
	testMatch: [ '<rootDir>/tests/**/*.test.js' ],
	clearMocks: true,
};
