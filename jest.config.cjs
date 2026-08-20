module.exports = {
	// Os módulos manipulam o DOM (contenteditable, closest, querySelectorAll),
	// então os testes rodam num DOM simulado.
	testEnvironment: 'jsdom',
	testMatch: [ '<rootDir>/tests/**/*.test.js' ],
	clearMocks: true,
	// Os imports do plugin carregam com `?ver=` para cache-busting no
	// navegador. O Node/Jest trata o import como caminho de arquivo, então
	// aqui removemos a query para o módulo resolver normalmente nos testes.
	moduleNameMapper: {
		'^(\\.{1,2}/.*?\\.js)\\?ver=.*$': '$1',
	},
};
