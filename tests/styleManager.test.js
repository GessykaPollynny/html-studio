/**
 * Testes do StyleManager — o gerador do CSS aplicado pela aba Estilo.
 *
 * Trava o comportamento descoberto no usuart.com: sem `!important`, o CSS
 * do próprio HTML do usuário (ex. `.usuart-google h2 { font-size: 40px }`)
 * vencia o seletor de atributo do plugin por especificidade e as mudanças
 * de estilo não apareciam.
 */

import StyleManager from '../html-visual-editor/assets/js/modules/StyleManager.js';

describe( 'StyleManager.buildBlock', () => {
	test( 'cada declaração recebe !important', () => {
		const css = StyleManager.buildBlock( '[data-hve-style-id="abc"]', {
			'font-size': '45px',
			'font-family': 'jost',
			color: '#111111',
		} );

		expect( css ).toContain( 'font-size: 45px !important;' );
		expect( css ).toContain( 'font-family: jost !important;' );
		expect( css ).toContain( 'color: #111111 !important;' );
	} );

	test( 'sem propriedades não gera bloco', () => {
		expect( StyleManager.buildBlock( '[data-hve-style-id="abc"]', {} ) ).toBe( '' );
	} );

	test( 'monta o seletor com as declarações entre chaves', () => {
		const css = StyleManager.buildBlock( '[data-hve-style-id="abc"]', { color: 'red' } );

		expect( css.trim() ).toBe( '[data-hve-style-id="abc"] { color: red !important; }' );
	} );
} );
