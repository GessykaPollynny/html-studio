import ResponsiveState from '../ResponsiveState.js?ver=1.1.7';

const BREAKPOINTS = [
	{ id: 'desktop', label: 'Desktop' },
	{ id: 'tablet', label: 'Tablet' },
	{ id: 'mobile', label: 'Mobile' },
];

/**
 * ResponsiveTab — seletor do breakpoint ativo.
 *
 * Apenas lê/escreve o estado compartilhado {@link ResponsiveState}. A
 * Fase 7 (StyleTab) observa o mesmo estado para saber em qual "balde"
 * de estilos gravar as alterações, sem que esta aba precise saber nada
 * sobre CSS.
 */
export default class ResponsiveTab {
	constructor() {
		this.container = null;
		this.buttons = new Map();
		this.unsubscribe = null;
	}

	/**
	 * @param {HTMLElement} container
	 */
	mount( container ) {
		this.container = container;
		container.classList.add( 'hve-responsive-tab' );

		const wrapper = document.createElement( 'div' );
		wrapper.className = 'hve-responsive-tab__switch';

		BREAKPOINTS.forEach( ( breakpoint ) => {
			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'hve-responsive-tab__button';
			button.textContent = breakpoint.label;
			button.addEventListener( 'click', () => ResponsiveState.set( breakpoint.id ) );

			this.buttons.set( breakpoint.id, button );
			wrapper.appendChild( button );
		} );

		container.appendChild( wrapper );

		this.highlightActive( ResponsiveState.get() );
		this.unsubscribe = ResponsiveState.subscribe( ( breakpoint ) => this.highlightActive( breakpoint ) );
	}

	unmount() {
		if ( this.unsubscribe ) {
			this.unsubscribe();
			this.unsubscribe = null;
		}

		this.buttons.clear();
		this.container = null;
	}

	/**
	 * @param {string} breakpoint
	 */
	highlightActive( breakpoint ) {
		this.buttons.forEach( ( button, id ) => {
			button.classList.toggle( 'hve-responsive-tab__button--active', id === breakpoint );
		} );
	}
}
