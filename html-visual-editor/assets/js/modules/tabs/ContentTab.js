import RichTextToolbar from '../RichTextToolbar.js';
import FieldBuilder from '../FieldBuilder.js';

/**
 * Tags cujo conteúdo textual é editável via contenteditable + RichTextToolbar.
 */
const TEXT_TAGS = new Set( [
	'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'label', 'button', 'a',
] );

/**
 * Tags com atributo `placeholder`.
 */
const PLACEHOLDER_TAGS = new Set( [ 'input', 'textarea' ] );

/**
 * ContentTab — edição de texto, links, alt/title de imagem, placeholder
 * e HTML interno do elemento selecionado.
 *
 * Cada tipo de campo é construído de forma independente; nenhum deles
 * conhece o outro, e todos terminam chamando `context.notifyChange()`
 * para a Fase 8 (histórico) registrar a alteração.
 */
export default class ContentTab {
	constructor() {
		this.container = null;
		this.context = null;
		this.richText = null;
		this.editableElement = null;
		this.previousContentEditable = null;
		this.onInput = null;
	}

	/**
	 * @param {HTMLElement} container
	 * @param {Object} context
	 */
	mount( container, context ) {
		this.container = container;
		this.context = context;

		const tag = context.element.tagName.toLowerCase();

		if ( TEXT_TAGS.has( tag ) ) {
			this.mountTextEditor( context.element );
		}

		if ( 'a' === tag ) {
			this.mountLinkFields( context.element );
		}

		if ( 'img' === tag ) {
			this.mountImageTextFields( context.element );
		}

		if ( PLACEHOLDER_TAGS.has( tag ) ) {
			this.mountPlaceholderField( context.element );
		}

		this.mountRawHtmlEditor( context.element );
	}

	unmount() {
		this.disableTextEditing();
		this.container = null;
		this.context = null;
	}

	/**
	 * Liga o contenteditable no elemento e monta a barra de formatação.
	 *
	 * @param {Element} element
	 */
	mountTextEditor( element ) {
		const section = FieldBuilder.section( 'Texto' );

		this.richText = new RichTextToolbar();
		this.richText.mount( section, element );

		this.container.appendChild( section );

		this.editableElement = element;
		this.previousContentEditable = element.getAttribute( 'contenteditable' );
		element.setAttribute( 'contenteditable', 'true' );
		element.classList.add( 'hve-text-editing' );

		this.onInput = () => this.context.notifyChange();
		element.addEventListener( 'input', this.onInput );
	}

	/**
	 * Restaura o elemento ao estado anterior (fora do modo de edição de texto).
	 */
	disableTextEditing() {
		if ( ! this.editableElement ) {
			return;
		}

		this.editableElement.removeEventListener( 'input', this.onInput );
		this.editableElement.classList.remove( 'hve-text-editing' );

		if ( null === this.previousContentEditable ) {
			this.editableElement.removeAttribute( 'contenteditable' );
		} else {
			this.editableElement.setAttribute( 'contenteditable', this.previousContentEditable );
		}

		if ( this.richText ) {
			this.richText.unmount();
			this.richText = null;
		}

		this.editableElement = null;
		this.onInput = null;
	}

	/**
	 * @param {Element} element
	 */
	mountLinkFields( element ) {
		const section = FieldBuilder.section( 'Link' );

		section.appendChild( FieldBuilder.textInput( 'URL (href)', element.getAttribute( 'href' ) || '', ( value ) => {
			element.setAttribute( 'href', value );
			this.context.notifyChange();
		} ) );

		section.appendChild( FieldBuilder.checkbox( 'Abrir em nova aba', '_blank' === element.getAttribute( 'target' ), ( checked ) => {
			if ( checked ) {
				element.setAttribute( 'target', '_blank' );
				element.setAttribute( 'rel', 'noopener noreferrer' );
			} else {
				element.removeAttribute( 'target' );
				element.removeAttribute( 'rel' );
			}

			this.context.notifyChange();
		} ) );

		this.container.appendChild( section );
	}

	/**
	 * @param {Element} element
	 */
	mountImageTextFields( element ) {
		const section = FieldBuilder.section( 'Imagem' );

		section.appendChild( FieldBuilder.textInput( 'Texto alternativo (alt)', element.getAttribute( 'alt' ) || '', ( value ) => {
			element.setAttribute( 'alt', value );
			this.context.notifyChange();
		} ) );

		section.appendChild( FieldBuilder.textInput( 'Title', element.getAttribute( 'title' ) || '', ( value ) => {
			element.setAttribute( 'title', value );
			this.context.notifyChange();
		} ) );

		this.container.appendChild( section );
	}

	/**
	 * @param {Element} element
	 */
	mountPlaceholderField( element ) {
		const section = FieldBuilder.section( 'Campo' );

		section.appendChild( FieldBuilder.textInput( 'Placeholder', element.getAttribute( 'placeholder' ) || '', ( value ) => {
			element.setAttribute( 'placeholder', value );
			this.context.notifyChange();
		} ) );

		this.container.appendChild( section );
	}

	/**
	 * Editor de HTML interno bruto — disponível para qualquer elemento.
	 *
	 * @param {Element} element
	 */
	mountRawHtmlEditor( element ) {
		const details = document.createElement( 'details' );
		details.className = 'hve-content-tab__raw';

		const summary = document.createElement( 'summary' );
		summary.textContent = 'Editar HTML interno';
		details.appendChild( summary );

		const textarea = document.createElement( 'textarea' );
		textarea.className = 'hve-content-tab__raw-textarea';
		textarea.value = element.innerHTML.trim();
		details.appendChild( textarea );

		const applyButton = document.createElement( 'button' );
		applyButton.type = 'button';
		applyButton.className = 'hve-content-tab__raw-apply';
		applyButton.textContent = 'Aplicar HTML';
		applyButton.addEventListener( 'click', () => {
			element.innerHTML = textarea.value;
			this.context.notifyChange();
		} );
		details.appendChild( applyButton );

		this.container.appendChild( details );
	}
}
