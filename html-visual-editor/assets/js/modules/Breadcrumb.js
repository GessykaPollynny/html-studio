import DOMInspector from './DOMInspector.js?ver=1.1.5';

/**
 * Breadcrumb — barra flutuante com a hierarquia do elemento selecionado.
 *
 * Puramente apresentacional: recebe a cadeia de elementos e um callback
 * de navegação; não conhece SelectionManager nem regras de seleção.
 */
export default class Breadcrumb {
	/**
	 * @param {HTMLElement} root Container onde a barra será montada (#hve-root).
	 * @param {(element: Element) => void} onNavigate Chamado ao clicar em um item da cadeia.
	 */
	constructor( root, onNavigate ) {
		this.root = root;
		this.onNavigate = onNavigate;
		this.element = null;
	}

	/**
	 * Cria e insere a barra (inicialmente oculta) no DOM.
	 */
	mount() {
		this.element = document.createElement( 'div' );
		this.element.className = 'hve-breadcrumb';
		this.element.hidden = true;

		this.root.appendChild( this.element );
	}

	/**
	 * Renderiza a cadeia de ancestrais como botões navegáveis.
	 *
	 * @param {Element[]} chain Cadeia raiz -> elemento selecionado.
	 */
	render( chain ) {
		if ( ! this.element ) {
			return;
		}

		if ( ! chain || ! chain.length ) {
			this.hide();
			return;
		}

		this.element.innerHTML = '';

		chain.forEach( ( el, index ) => {
			if ( index > 0 ) {
				const separator = document.createElement( 'span' );
				separator.className = 'hve-breadcrumb__separator';
				separator.textContent = '/';
				this.element.appendChild( separator );
			}

			const item = document.createElement( 'button' );
			item.type = 'button';
			item.className = 'hve-breadcrumb__item';
			item.textContent = DOMInspector.describe( el );

			if ( index === chain.length - 1 ) {
				item.classList.add( 'hve-breadcrumb__item--current' );
				item.disabled = true;
			}

			item.addEventListener( 'click', () => this.onNavigate( el ) );

			this.element.appendChild( item );
		} );

		this.element.hidden = false;
	}

	/**
	 * Oculta a barra (nenhum elemento selecionado).
	 */
	hide() {
		if ( this.element ) {
			this.element.hidden = true;
		}
	}
}
