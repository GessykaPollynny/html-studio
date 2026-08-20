import DOMInspector from './DOMInspector.js?ver=1.1.6';

const HOVER_OUTLINE = '2px solid var(--hve-color-outline-hover)';
const SELECTED_OUTLINE = '2px solid var(--hve-color-outline-selected)';

/**
 * SelectionManager — hover/seleção de elementos via delegação de eventos.
 *
 * Usa um único listener por tipo de evento no `document` (fase de
 * captura), em vez de vincular handlers a cada elemento individualmente
 * — essencial para performance em HTML gerado dinamicamente. O outline
 * é aplicado via `style` inline (maior especificidade que o CSS da
 * página) e o valor original é sempre restaurado ao desselecionar.
 *
 * Emite eventos padrão do DOM ('select' / 'deselect') consumidos pelo
 * Panel (Fase 4).
 */
export default class SelectionManager extends EventTarget {
	/**
	 * @param {() => Element[]} getRoots Função que retorna os containers editáveis atuais.
	 */
	constructor( getRoots ) {
		super();

		this.getRoots = getRoots;
		this.hovered = null;
		this.selected = null;
		this.selectedRoot = null;
		this.originalOutlines = new WeakMap();

		this.handleMouseOver = this.handleMouseOver.bind( this );
		this.handleMouseOut = this.handleMouseOut.bind( this );
		this.handleClick = this.handleClick.bind( this );
	}

	/**
	 * Liga os listeners globais de seleção.
	 */
	enable() {
		document.addEventListener( 'mouseover', this.handleMouseOver, true );
		document.addEventListener( 'mouseout', this.handleMouseOut, true );
		document.addEventListener( 'click', this.handleClick, true );
	}

	/**
	 * Desliga os listeners e limpa qualquer outline pendente.
	 */
	disable() {
		document.removeEventListener( 'mouseover', this.handleMouseOver, true );
		document.removeEventListener( 'mouseout', this.handleMouseOut, true );
		document.removeEventListener( 'click', this.handleClick, true );

		this.clearHover();
		this.clearSelection();
	}

	/**
	 * Resolve o elemento suportado mais próximo do alvo de um evento,
	 * dentro de algum dos containers editáveis atuais.
	 *
	 * @param {Event} event
	 * @return {{el: Element, root: Element}|null}
	 */
	resolveTarget( event ) {
		const roots = this.getRoots();

		for ( const root of roots ) {
			if ( ! root.contains( event.target ) ) {
				continue;
			}

			const el = DOMInspector.closestSupported( event.target, root );

			if ( el ) {
				return { el, root };
			}
		}

		return null;
	}

	/**
	 * @param {MouseEvent} event
	 */
	handleMouseOver( event ) {
		const match = this.resolveTarget( event );

		if ( ! match || match.el === this.selected ) {
			return;
		}

		this.setHover( match.el );
	}

	/**
	 * @param {MouseEvent} event
	 */
	handleMouseOut( event ) {
		const match = this.resolveTarget( event );

		if ( match && match.el === this.hovered ) {
			this.clearHover();
		}
	}

	/**
	 * @param {MouseEvent} event
	 */
	handleClick( event ) {
		const match = this.resolveTarget( event );

		if ( ! match ) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		this.select( match.el, match.root );
	}

	/**
	 * Programaticamente seleciona um elemento (usado pelo Breadcrumb ao
	 * navegar para um ancestral, ou pelo painel ao navegar para um filho).
	 *
	 * @param {Element} element
	 * @param {Element} root
	 */
	select( element, root ) {
		this.clearHover();
		this.clearSelection();

		this.selected = element;
		this.selectedRoot = root;

		this.saveOutline( element );
		element.style.outline = SELECTED_OUTLINE;
		element.style.outlineOffset = '1px';

		this.dispatchEvent( new CustomEvent( 'select', {
			detail: {
				element,
				root,
				breadcrumb: DOMInspector.getBreadcrumb( element, root ),
				children: DOMInspector.getSelectableChildren( element ),
			},
		} ) );
	}

	/**
	 * Limpa a seleção atual, restaurando o outline original.
	 */
	clearSelection() {
		if ( ! this.selected ) {
			return;
		}

		const element = this.selected;

		this.restoreOutline( element );
		this.selected = null;
		this.selectedRoot = null;

		this.dispatchEvent( new CustomEvent( 'deselect', { detail: { element } } ) );
	}

	/**
	 * @param {Element} element
	 */
	setHover( element ) {
		this.clearHover();

		this.hovered = element;

		this.saveOutline( element );
		element.style.outline = HOVER_OUTLINE;
		element.style.outlineOffset = '1px';
	}

	/**
	 * Remove o outline de hover (nunca do elemento selecionado).
	 */
	clearHover() {
		if ( ! this.hovered || this.hovered === this.selected ) {
			this.hovered = null;
			return;
		}

		this.restoreOutline( this.hovered );
		this.hovered = null;
	}

	/**
	 * Guarda o outline original de um elemento, uma única vez.
	 *
	 * @param {Element} element
	 */
	saveOutline( element ) {
		if ( ! this.originalOutlines.has( element ) ) {
			this.originalOutlines.set( element, {
				outline: element.style.outline,
				outlineOffset: element.style.outlineOffset,
			} );
		}
	}

	/**
	 * Restaura o outline original de um elemento.
	 *
	 * @param {Element} element
	 */
	restoreOutline( element ) {
		const original = this.originalOutlines.get( element );

		if ( original ) {
			element.style.outline = original.outline;
			element.style.outlineOffset = original.outlineOffset;
		}

		this.originalOutlines.delete( element );
	}
}
