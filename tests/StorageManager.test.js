/**
 * Testes da lógica de salvamento no frontend (StorageManager).
 *
 * Cobrem o coração do caminho de "Salvar": a resolução do id estável do
 * Elementor (correção de múltiplos Widgets HTML), a limpeza dos artefatos
 * de edição antes de persistir, a coleta dos ids de estilo e a montagem do
 * HTML salvável.
 */

import StorageManager from '../html-visual-editor/assets/js/modules/StorageManager.js';

/**
 * Cria um StorageManager com config vazia e a lista de roots informada.
 *
 * @param {Element[]} roots
 * @return {StorageManager}
 */
function makeStorage( roots = [] ) {
	return new StorageManager( {}, () => roots );
}

afterEach( () => {
	document.body.innerHTML = '';
} );

describe( 'resolveElementId (correção de múltiplos widgets)', () => {
	test( 'retorna o data-id do wrapper .elementor-element', () => {
		document.body.innerHTML = `
			<div class="elementor-element elementor-element-90dfa87 elementor-widget elementor-widget-html" data-id="90dfa87">
				<div class="elementor-widget-container"><h2>Olá</h2></div>
			</div>`;

		const root = document.querySelector( '.elementor-widget-container' );

		expect( makeStorage( [ root ] ).resolveElementId( root ) ).toBe( '90dfa87' );
	} );

	test( 'retorna string vazia quando não há wrapper com data-id', () => {
		document.body.innerHTML = `
			<div class="sem-elementor">
				<div class="elementor-widget-container"></div>
			</div>`;

		const root = document.querySelector( '.elementor-widget-container' );

		expect( makeStorage( [ root ] ).resolveElementId( root ) ).toBe( '' );
	} );

	test( 'dois widgets distintos resolvem ids distintos (sem colisão)', () => {
		document.body.innerHTML = `
			<div class="elementor-element" data-id="aaa1111"><div class="elementor-widget-container">A</div></div>
			<div class="elementor-element" data-id="bbb2222"><div class="elementor-widget-container">B</div></div>`;

		const roots = Array.from( document.querySelectorAll( '.elementor-widget-container' ) );
		const sm = makeStorage( roots );

		expect( roots.map( ( r ) => sm.resolveElementId( r ) ) ).toEqual( [ 'aaa1111', 'bbb2222' ] );
	} );
} );

describe( 'stripEditingArtifacts', () => {
	test( 'remove marcadores de edição e o outline temporário, preservando o resto', () => {
		document.body.innerHTML = `
			<div class="elementor-widget-container">
				<h2 contenteditable="true" data-hve-editable-root="true"
					class="hve-text-editing titulo"
					style="outline: 2px solid blue; outline-offset: 2px; color: red;">T</h2>
			</div>`;

		const clone = document.querySelector( '.elementor-widget-container' ).cloneNode( true );
		makeStorage().stripEditingArtifacts( clone );

		const h2 = clone.querySelector( 'h2' );
		expect( h2.hasAttribute( 'contenteditable' ) ).toBe( false );
		expect( h2.hasAttribute( 'data-hve-editable-root' ) ).toBe( false );
		expect( h2.classList.contains( 'hve-text-editing' ) ).toBe( false );
		expect( h2.classList.contains( 'titulo' ) ).toBe( true );
		expect( h2.style.outline ).toBe( '' );
		expect( h2.style.color ).toBe( 'red' );
	} );

	test( 'remove os atributos class/style quando ficam vazios', () => {
		document.body.innerHTML = `
			<div class="elementor-widget-container">
				<span class="hve-text-editing" style="outline: 1px solid red;">x</span>
			</div>`;

		const clone = document.querySelector( '.elementor-widget-container' ).cloneNode( true );
		makeStorage().stripEditingArtifacts( clone );

		const span = clone.querySelector( 'span' );
		expect( span.hasAttribute( 'class' ) ).toBe( false );
		expect( span.hasAttribute( 'style' ) ).toBe( false );
	} );
} );

describe( 'collectStyleIds', () => {
	test( 'coleta o data-hve-style-id do root e de todos os descendentes', () => {
		document.body.innerHTML = `
			<div class="elementor-widget-container" data-hve-style-id="root1">
				<p data-hve-style-id="p1">x</p>
				<span>sem id</span>
				<b data-hve-style-id="b1">y</b>
			</div>`;

		const root = document.querySelector( '.elementor-widget-container' );
		const ids = makeStorage().collectStyleIds( root );

		expect( Array.from( ids ).sort() ).toEqual( [ 'b1', 'p1', 'root1' ] );
	} );

	test( 'retorna conjunto vazio quando não há ids de estilo', () => {
		document.body.innerHTML = `<div class="elementor-widget-container"><p>x</p></div>`;

		const root = document.querySelector( '.elementor-widget-container' );

		expect( makeStorage().collectStyleIds( root ).size ).toBe( 0 );
	} );
} );

describe( 'buildSavableHtml', () => {
	test( 'devolve o HTML interno já sem os artefatos de edição', () => {
		document.body.innerHTML = `
			<div class="elementor-widget-container">
				<h2 contenteditable="true" data-hve-editable-root="true" class="hve-text-editing">Título</h2>
			</div>`;

		const root = document.querySelector( '.elementor-widget-container' );
		const html = makeStorage().buildSavableHtml( root );

		expect( html ).toContain( 'Título' );
		expect( html ).not.toContain( 'contenteditable' );
		expect( html ).not.toContain( 'hve-text-editing' );
	} );

	test( 'não embute tag <style> quando o widget não tem estilos gerenciados', () => {
		document.body.innerHTML = `<div class="elementor-widget-container"><p>sem estilo</p></div>`;

		const root = document.querySelector( '.elementor-widget-container' );

		expect( makeStorage().buildSavableHtml( root ) ).not.toContain( '<style' );
	} );

	test( 'não acumula blocos <style data-hve-managed> de salvamentos anteriores', () => {
		document.body.innerHTML = `
			<div class="elementor-widget-container">
				<style data-hve-managed="true">[data-hve-style-id="antigo"]{color:red !important;}</style>
				<h2>Título</h2>
			</div>`;

		const root = document.querySelector( '.elementor-widget-container' );
		const html = makeStorage().buildSavableHtml( root );

		expect( html ).not.toContain( 'data-hve-style-id="antigo"' );
		expect( html ).not.toContain( 'data-hve-managed' );
		expect( html ).toContain( 'Título' );
	} );
} );
