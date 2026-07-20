/**
 * LayoutTab — ações estruturais sobre o elemento selecionado.
 *
 * Toda ação DOM termina chamando `context.notifyChange()` (para a Fase 8
 * registrar no histórico) e, quando o elemento selecionado deixa de
 * existir ou é substituído, `context.reselect()` / `context.deselect()`
 * mantêm o painel sincronizado com a nova realidade do DOM.
 */
export default class LayoutTab {
	constructor() {
		this.container = null;
		this.context = null;
	}

	/**
	 * @param {HTMLElement} container
	 * @param {Object} context
	 */
	mount( container, context ) {
		this.container = container;
		this.context = context;

		container.classList.add( 'hve-layout-tab' );
		container.appendChild( this.buildActions() );
	}

	unmount() {
		this.container = null;
		this.context = null;
	}

	/**
	 * @return {HTMLElement}
	 */
	buildActions() {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'hve-layout-tab__grid';

		const actions = [
			{ label: 'Duplicar', handler: () => this.duplicate() },
			{ label: 'Excluir', handler: () => this.remove() },
			{ label: 'Mover para cima', handler: () => this.moveUp() },
			{ label: 'Mover para baixo', handler: () => this.moveDown() },
			{ label: 'Mover antes', handler: () => this.moveBeforeParent() },
			{ label: 'Mover depois', handler: () => this.moveAfterParent() },
			{ label: 'Agrupar', handler: () => this.group() },
			{ label: 'Desagrupar', handler: () => this.ungroup(), disabled: ! this.canUngroup() },
		];

		actions.forEach( ( action ) => {
			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'hve-layout-tab__action';
			button.textContent = action.label;
			button.disabled = !! action.disabled;
			button.addEventListener( 'click', action.handler );
			wrapper.appendChild( button );
		} );

		return wrapper;
	}

	canUngroup() {
		return !! this.context && this.context.element.children.length > 0;
	}

	duplicate() {
		const { element } = this.context;
		const clone = element.cloneNode( true );

		element.after( clone );

		this.context.notifyChange();
		this.context.reselect( clone );
	}

	remove() {
		const { element } = this.context;

		element.remove();

		this.context.notifyChange();
		this.context.deselect();
	}

	moveUp() {
		const { element } = this.context;
		const previous = element.previousElementSibling;

		if ( ! previous ) {
			return;
		}

		previous.before( element );

		this.context.notifyChange();
		this.context.reselect( element );
	}

	moveDown() {
		const { element } = this.context;
		const next = element.nextElementSibling;

		if ( ! next ) {
			return;
		}

		next.after( element );

		this.context.notifyChange();
		this.context.reselect( element );
	}

	moveBeforeParent() {
		const { element, root } = this.context;
		const parent = element.parentElement;

		if ( ! parent || parent === root ) {
			return;
		}

		parent.before( element );

		this.context.notifyChange();
		this.context.reselect( element );
	}

	moveAfterParent() {
		const { element, root } = this.context;
		const parent = element.parentElement;

		if ( ! parent || parent === root ) {
			return;
		}

		parent.after( element );

		this.context.notifyChange();
		this.context.reselect( element );
	}

	group() {
		const { element } = this.context;
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'hve-group';

		element.before( wrapper );
		wrapper.appendChild( element );

		this.context.notifyChange();
		this.context.reselect( wrapper );
	}

	ungroup() {
		const { element, root } = this.context;

		if ( ! this.canUngroup() || element === root ) {
			return;
		}

		const parent = element.parentElement;
		const children = Array.from( element.children );

		children.forEach( ( child ) => element.before( child ) );
		element.remove();

		this.context.notifyChange();

		if ( children.length ) {
			this.context.reselect( children[ 0 ] );
		} else {
			this.context.reselect( parent );
		}
	}
}
