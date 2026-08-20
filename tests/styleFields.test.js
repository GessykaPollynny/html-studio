/**
 * Testes dos novos campos da aba Estilo: seletor de cor e biblioteca de fontes.
 */

import FieldBuilder from '../html-visual-editor/assets/js/modules/FieldBuilder.js';
import { FONT_LIBRARY, googleFontParam } from '../html-visual-editor/assets/js/modules/Fonts.js';

describe( 'FieldBuilder.colorToHex', () => {
	test( 'normaliza hex de 3 e 6 dígitos', () => {
		expect( FieldBuilder.colorToHex( '#FFF' ) ).toBe( '#ffffff' );
		expect( FieldBuilder.colorToHex( '#Da0864' ) ).toBe( '#da0864' );
	} );

	test( 'converte rgb()/rgba() para hex', () => {
		expect( FieldBuilder.colorToHex( 'rgb(218, 8, 100)' ) ).toBe( '#da0864' );
		expect( FieldBuilder.colorToHex( 'rgba(0,0,0,0.5)' ) ).toBe( '#000000' );
	} );

	test( 'devolve null para valores que a caixinha não entende', () => {
		expect( FieldBuilder.colorToHex( 'transparent' ) ).toBeNull();
		expect( FieldBuilder.colorToHex( '' ) ).toBeNull();
		expect( FieldBuilder.colorToHex( 'red' ) ).toBeNull();
	} );
} );

describe( 'FieldBuilder.colorInput', () => {
	test( 'monta caixinha de cor sincronizada com o campo de texto', () => {
		const capturado = [];
		const field = FieldBuilder.colorInput( 'Cor do texto', '#da0864', ( v ) => capturado.push( v ) );

		const swatch = field.querySelector( 'input[type="color"]' );
		const text = field.querySelector( 'input[type="text"]' );

		expect( swatch ).not.toBeNull();
		expect( text.value ).toBe( '#da0864' );
		expect( swatch.value ).toBe( '#da0864' );

		// Digitar no texto dispara onChange e atualiza a caixinha.
		text.value = '#00ff00';
		text.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		expect( capturado ).toContain( '#00ff00' );
		expect( swatch.value ).toBe( '#00ff00' );
	} );
} );

describe( 'FieldBuilder.fontSelect', () => {
	test( 'cria opções para cada fonte e pré-seleciona o valor atual', () => {
		const field = FieldBuilder.fontSelect( 'Fonte', FONT_LIBRARY, 'Jost, sans-serif', () => {} );
		const select = field.querySelector( 'select' );

		expect( select.options.length ).toBe( FONT_LIBRARY.length );
		expect( select.value ).toBe( 'Jost, sans-serif' );
	} );
} );

describe( 'googleFontParam', () => {
	test( 'devolve o parâmetro family para uma Google Font', () => {
		expect( googleFontParam( 'Jost, sans-serif' ) ).toBe( 'Jost:wght@300;400;500;600;700' );
		expect( googleFontParam( 'Poppins, sans-serif' ) ).toContain( 'Poppins' );
	} );

	test( 'devolve null para fonte do sistema ou desconhecida', () => {
		expect( googleFontParam( 'Arial, sans-serif' ) ).toBeNull();
		expect( googleFontParam( 'FonteInexistente' ) ).toBeNull();
		expect( googleFontParam( '' ) ).toBeNull();
	} );
} );
