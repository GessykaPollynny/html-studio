/**
 * HTML Visual Editor — ponto de entrada (ES6 module).
 *
 * Carregado apenas quando o PHP (Frontend\AssetManager) determina que a
 * página atual é elegível para edição. Os módulos concretos (Selection,
 * Panel, History, Style, etc.) são conectados aqui progressivamente.
 */

import Editor from './modules/Editor.js?ver=1.1.8';

/**
 * Aplicação raiz do editor. Mantida enxuta de propósito: cada
 * responsabilidade (seleção, histórico, painel...) vive em seu próprio
 * módulo e é registrada aqui, nunca implementada inline.
 */
class HVEApplication {
	/**
	 * @param {Object|null} config Dados localizados via wp_localize_script (window.hveData).
	 */
	constructor( config ) {
		this.config = config;
		this.root = document.getElementById( 'hve-root' );
		this.editor = null;
	}

	/**
	 * Ponto único de inicialização da aplicação.
	 */
	init() {
		if ( ! this.config || ! this.root ) {
			return;
		}

		this.root.setAttribute( 'data-hve-mounted', 'true' );

		this.editor = new Editor( this.root, this.config );
		this.editor.init();
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	new HVEApplication( window.hveData || null ).init();
} );

export default HVEApplication;
