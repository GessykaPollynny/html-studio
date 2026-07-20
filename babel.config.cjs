// Usado apenas pelo babel-jest para transformar os ES modules do plugin
// durante os testes. Não afeta o código distribuído (que roda como ES
// modules nativos no navegador, sem build).
module.exports = {
	presets: [ [ '@babel/preset-env', { targets: { node: 'current' } } ] ],
};
