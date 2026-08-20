import FieldBuilder from '../FieldBuilder.js?ver=1.1.5';
import MediaManager from '../MediaManager.js?ver=1.1.5';

/**
 * ImagesTab — origem, dimensões e carregamento de <img>, além do
 * background-image (disponível em qualquer elemento, útil para seções
 * com imagem de fundo geradas por IA).
 */
export default class ImagesTab {
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

		if ( 'img' === context.element.tagName.toLowerCase() ) {
			this.mountImageSource( context.element );
			this.mountLoadingField( context.element );
			this.mountDimensionFields( context.element );
		}

		this.mountBackgroundImageField( context.element );
	}

	unmount() {
		this.container = null;
		this.context = null;
	}

	/**
	 * @param {HTMLImageElement} element
	 */
	mountImageSource( element ) {
		const section = FieldBuilder.section( 'Origem da imagem' );

		const preview = document.createElement( 'img' );
		preview.className = 'hve-image-tab__preview';
		preview.src = element.getAttribute( 'src' ) || '';
		section.appendChild( preview );

		const urlField = FieldBuilder.textInput( 'URL da imagem (src)', element.getAttribute( 'src' ) || '', ( value ) => {
			element.setAttribute( 'src', value );
			preview.src = value;
			this.context.notifyChange();
		} );
		section.appendChild( urlField );

		const pickButton = document.createElement( 'button' );
		pickButton.type = 'button';
		pickButton.className = 'hve-image-tab__pick';
		pickButton.textContent = 'Selecionar da Biblioteca de Mídia';
		pickButton.addEventListener( 'click', () => {
			MediaManager.open( ( attachment ) => {
				element.setAttribute( 'src', attachment.url );

				if ( attachment.alt ) {
					element.setAttribute( 'alt', attachment.alt );
				}

				preview.src = attachment.url;
				urlField.input.value = attachment.url;

				this.context.notifyChange();
			} );
		} );
		section.appendChild( pickButton );

		this.container.appendChild( section );
	}

	/**
	 * @param {HTMLImageElement} element
	 */
	mountLoadingField( element ) {
		const section = FieldBuilder.section( 'Carregamento' );

		section.appendChild( FieldBuilder.select( 'Loading', [
			{ value: 'eager', label: 'Eager (imediato)' },
			{ value: 'lazy', label: 'Lazy (sob demanda)' },
		], element.getAttribute( 'loading' ) || 'eager', ( value ) => {
			element.setAttribute( 'loading', value );
			this.context.notifyChange();
		} ) );

		this.container.appendChild( section );
	}

	/**
	 * @param {HTMLImageElement} element
	 */
	mountDimensionFields( element ) {
		const section = FieldBuilder.section( 'Dimensões' );

		section.appendChild( FieldBuilder.numberInput( 'Width (px)', element.getAttribute( 'width' ) || '', ( value ) => {
			element.setAttribute( 'width', value );
			this.context.notifyChange();
		} ) );

		section.appendChild( FieldBuilder.numberInput( 'Height (px)', element.getAttribute( 'height' ) || '', ( value ) => {
			element.setAttribute( 'height', value );
			this.context.notifyChange();
		} ) );

		this.container.appendChild( section );
	}

	/**
	 * @param {Element} element
	 */
	mountBackgroundImageField( element ) {
		const section = FieldBuilder.section( 'Imagem de fundo (background-image)' );

		const currentUrl = this.extractBackgroundUrl( element );

		const urlField = FieldBuilder.textInput( 'URL da imagem de fundo', currentUrl, ( value ) => {
			this.applyBackground( element, value );
		} );
		section.appendChild( urlField );

		const pickButton = document.createElement( 'button' );
		pickButton.type = 'button';
		pickButton.className = 'hve-image-tab__pick';
		pickButton.textContent = 'Selecionar da Biblioteca de Mídia';
		pickButton.addEventListener( 'click', () => {
			MediaManager.open( ( attachment ) => {
				urlField.input.value = attachment.url;
				this.applyBackground( element, attachment.url );
			} );
		} );
		section.appendChild( pickButton );

		if ( currentUrl ) {
			const clearButton = document.createElement( 'button' );
			clearButton.type = 'button';
			clearButton.className = 'hve-image-tab__clear';
			clearButton.textContent = 'Remover imagem de fundo';
			clearButton.addEventListener( 'click', () => {
				urlField.input.value = '';
				this.applyBackground( element, '' );
			} );
			section.appendChild( clearButton );
		}

		this.container.appendChild( section );
	}

	/**
	 * @param {Element} element
	 * @param {string} url
	 */
	applyBackground( element, url ) {
		element.style.backgroundImage = url ? `url("${ url }")` : '';
		this.context.notifyChange();
	}

	/**
	 * Extrai a URL de um `background-image: url(...)` já aplicado, se houver.
	 *
	 * @param {Element} element
	 * @return {string}
	 */
	extractBackgroundUrl( element ) {
		const value = element.style.backgroundImage || window.getComputedStyle( element ).backgroundImage;
		const match = /url\((['"]?)(.*?)\1\)/.exec( value || '' );

		return match ? match[ 2 ] : '';
	}
}
