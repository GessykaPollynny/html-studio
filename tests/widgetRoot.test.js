/**
 * Testes de resolveWidgetRoot — o coração da correção do bug descoberto no
 * usuart.com: o Elementor renderiza o Widget HTML com OU sem a
 * `.elementor-widget-container`, e o plugin precisa achar o root editável
 * nos dois casos.
 */

import { WIDGET_SELECTOR, resolveWidgetRoot } from '../html-visual-editor/assets/js/modules/constants.js';

afterEach( () => {
	document.body.innerHTML = '';
} );

describe( 'resolveWidgetRoot', () => {
	test( 'estrutura clássica: devolve a .elementor-widget-container', () => {
		document.body.innerHTML = `
			<div class="elementor-element elementor-widget elementor-widget-html" data-id="aaa1111">
				<div class="elementor-widget-container">
					<section><h2>Quem somos</h2></section>
				</div>
			</div>`;

		const widget = document.querySelector( WIDGET_SELECTOR );
		const root = resolveWidgetRoot( widget );

		expect( root.classList.contains( 'elementor-widget-container' ) ).toBe( true );
		expect( root.querySelector( 'h2' ).textContent ).toBe( 'Quem somos' );
	} );

	test( 'DOM otimizado (sem container): devolve o próprio widget', () => {
		document.body.innerHTML = `
			<div class="elementor-element elementor-widget elementor-widget-html" data-id="bbb2222">
				<section class="usuart-quem-somos"><h2>Quem somos</h2></section>
			</div>`;

		const widget = document.querySelector( WIDGET_SELECTOR );
		const root = resolveWidgetRoot( widget );

		expect( root ).toBe( widget );
		expect( root.querySelector( '.usuart-quem-somos' ) ).not.toBeNull();
	} );

	test( 'ignora .elementor-widget-container aninhada no conteúdo do usuário', () => {
		// Se o HTML do usuário por acaso tiver essa classe lá no fundo, o
		// root ainda deve ser o próprio widget (só conta o filho direto).
		document.body.innerHTML = `
			<div class="elementor-element elementor-widget elementor-widget-html" data-id="ccc3333">
				<section>
					<div class="elementor-widget-container">conteúdo do usuário</div>
				</section>
			</div>`;

		const widget = document.querySelector( WIDGET_SELECTOR );

		expect( resolveWidgetRoot( widget ) ).toBe( widget );
	} );

	test( 'WIDGET_SELECTOR encontra os widgets, com e sem container', () => {
		document.body.innerHTML = `
			<div class="elementor-widget-html" data-id="a"><div class="elementor-widget-container">A</div></div>
			<div class="elementor-widget-html" data-id="b"><section>B</section></div>`;

		expect( document.querySelectorAll( WIDGET_SELECTOR ) ).toHaveLength( 2 );
	} );
} );
