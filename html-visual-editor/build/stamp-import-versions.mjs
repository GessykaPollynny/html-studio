/**
 * Carimba a versão do plugin (`?ver=X.Y.Z`) em todos os `import` internos
 * dos módulos JS, para cache-busting no navegador.
 *
 * Por quê: o WordPress versiona apenas o script enfileirado (main.js) via
 * `?ver=`. Os `import` que um módulo faz de outro são resolvidos pelo
 * próprio navegador, sem passar pelo enqueue — então ficavam sem versão e
 * o navegador servia a cópia antiga do cache mesmo após uma atualização do
 * plugin. Carimbar a versão em cada import faz toda a árvore de módulos ser
 * rebaixada automaticamente quando a versão muda.
 *
 * Uso (rodar a cada release, com a versão nova):
 *   node html-visual-editor/build/stamp-import-versions.mjs 1.1.4
 *
 * É idempotente: substitui um `?ver=` já existente pelo novo valor.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[ 2 ];

if ( ! version ) {
	console.error( 'Uso: node stamp-import-versions.mjs <versao>' );
	process.exit( 1 );
}

const jsRoot = join( dirname( fileURLToPath( import.meta.url ) ), '..', 'assets', 'js' );

/**
 * @param {string} dir
 * @return {string[]}
 */
function listarJs( dir ) {
	return readdirSync( dir, { withFileTypes: true } ).flatMap( ( entry ) => {
		const caminho = join( dir, entry.name );
		if ( entry.isDirectory() ) {
			return listarJs( caminho );
		}
		return entry.name.endsWith( '.js' ) ? [ caminho ] : [];
	} );
}

// from '<relativo>.js' com ou sem um ?ver= já presente.
const importRe = /(\bfrom\s*['"])(\.\.?\/[^'"]+?\.js)(?:\?ver=[^'"]*)?(['"])/g;

let total = 0;

for ( const arquivo of listarJs( jsRoot ) ) {
	const origem = readFileSync( arquivo, 'utf8' );
	const novo = origem.replace( importRe, ( _match, antes, especificador, depois ) => {
		total++;
		return `${ antes }${ especificador }?ver=${ version }${ depois }`;
	} );

	if ( novo !== origem ) {
		writeFileSync( arquivo, novo );
	}
}

console.log( `Imports carimbados com ?ver=${ version }: ${ total }` );
