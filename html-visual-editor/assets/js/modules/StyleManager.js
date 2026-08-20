import { googleFontParam } from './Fonts.js?ver=1.1.8';

/**
 * Consultas de media query usadas para cada breakpoint gerenciado.
 * `desktop` não usa media query (é o estilo base).
 */
const BREAKPOINT_QUERIES = {
	tablet: '(max-width: 1024px)',
	mobile: '(max-width: 767px)',
};

const STYLE_ELEMENT_ID = 'hve-managed-styles';

/**
 * StyleManager — único ponto de escrita de CSS gerenciado pelo plugin.
 *
 * Nunca edita arquivos CSS nem aplica estilos que o navegador não possa
 * rastrear até aqui: tudo vive num único `<style>` no `<head>`, escrito a
 * partir de um mapa em memória { elementId: { desktop, tablet, mobile } }.
 * Cada elemento estilizado recebe um `data-hve-style-id` único, usado
 * como seletor das regras — o HTML original do usuário nunca é
 * poluído com estilos inline espalhados.
 */
class StyleManager {
	constructor() {
		this.rules = new Map();
		this.elementIds = new WeakMap();
		this.nextId = 1;
		this.styleElement = null;
	}

	/**
	 * @param {Element} element
	 * @param {string} property Propriedade CSS em kebab-case (ex.: 'background-color').
	 * @param {string} value Valor CSS. Vazio remove a regra.
	 * @param {'desktop'|'tablet'|'mobile'} breakpoint
	 */
	setProperty( element, property, value, breakpoint ) {
		const id = this.getElementId( element );

		if ( ! this.rules.has( id ) ) {
			this.rules.set( id, { desktop: {}, tablet: {}, mobile: {} } );
		}

		const bucket = this.rules.get( id )[ breakpoint ];

		if ( ! value ) {
			delete bucket[ property ];
		} else {
			bucket[ property ] = value;
		}

		// Carrega a fonte escolhida para que o preview a mostre de imediato
		// durante a edição (a persistência vem do @import em renderForIds).
		if ( 'font-family' === property && value ) {
			this.ensureGoogleFont( googleFontParam( value ) );
		}

		this.render();
	}

	/**
	 * Injeta, uma única vez, o `<link>` do Google Fonts para a fonte
	 * escolhida — apenas para a pré-visualização durante a edição.
	 *
	 * @param {string|null} param Parâmetro `family` da API, ou null.
	 */
	ensureGoogleFont( param ) {
		if ( ! param ) {
			return;
		}

		const id = 'hve-gfont-' + param.replace( /[^a-zA-Z0-9]/g, '' );

		if ( document.getElementById( id ) ) {
			return;
		}

		const link = document.createElement( 'link' );
		link.id = id;
		link.rel = 'stylesheet';
		link.href = `https://fonts.googleapis.com/css2?family=${ param }&display=swap`;
		document.head.appendChild( link );
	}

	/**
	 * @param {Element} element
	 * @param {string} property
	 * @param {'desktop'|'tablet'|'mobile'} breakpoint
	 * @return {string}
	 */
	getProperty( element, property, breakpoint ) {
		const id = this.elementIds.get( element );

		if ( ! id || ! this.rules.has( id ) ) {
			return '';
		}

		return this.rules.get( id )[ breakpoint ][ property ] || '';
	}

	/**
	 * Exporta o mapa de regras como objeto simples serializável — usado
	 * pelo HistoryManager (Fase 8) para compor um snapshot de undo/redo.
	 *
	 * @return {Object<string,Object>}
	 */
	exportRules() {
		return Object.fromEntries(
			Array.from( this.rules.entries() ).map( ( [ id, breakpoints ] ) => [
				id,
				{
					desktop: { ...breakpoints.desktop },
					tablet: { ...breakpoints.tablet },
					mobile: { ...breakpoints.mobile },
				},
			] )
		);
	}

	/**
	 * Restaura o mapa de regras a partir de um snapshot de {@link exportRules}
	 * e reconstrói o `<style>` gerenciado.
	 *
	 * @param {Object<string,Object>} data
	 */
	importRules( data ) {
		this.rules = new Map( Object.entries( data || {} ) );
		this.render();
	}

	/**
	 * Resolve o id de estilo de um elemento, cunhando um novo apenas quando
	 * necessário.
	 *
	 * O `WeakMap` é apenas um cache: a fonte da verdade é o próprio atributo
	 * `data-hve-style-id` no DOM. Isso importa porque undo/redo (via
	 * `root.innerHTML = ...`) e duplicação de elementos recriam nós que já
	 * carregam o atributo no HTML restaurado/clonado, mas são objetos novos
	 * — sem essa checagem, um novo id seria cunhado e sobrescreveria o
	 * atributo existente, órfãos as regras já salvas para aquele elemento.
	 *
	 * @param {Element} element
	 * @return {string}
	 */
	getElementId( element ) {
		if ( ! this.elementIds.has( element ) ) {
			const existing = element.getAttribute( 'data-hve-style-id' );
			const id = existing || `hve-style-${ this.nextId++ }`;

			this.elementIds.set( element, id );

			if ( ! existing ) {
				element.setAttribute( 'data-hve-style-id', id );
			}
		}

		return this.elementIds.get( element );
	}

	/**
	 * Garante que o `<style>` gerenciado existe no `<head>`.
	 *
	 * @return {HTMLStyleElement}
	 */
	ensureStyleElement() {
		if ( this.styleElement && this.styleElement.isConnected ) {
			return this.styleElement;
		}

		this.styleElement = document.getElementById( STYLE_ELEMENT_ID ) || document.createElement( 'style' );
		this.styleElement.id = STYLE_ELEMENT_ID;

		if ( ! this.styleElement.isConnected ) {
			document.head.appendChild( this.styleElement );
		}

		return this.styleElement;
	}

	/**
	 * Reconstrói o conteúdo completo do `<style>` gerenciado a partir do
	 * mapa de regras em memória.
	 */
	render() {
		this.ensureStyleElement().textContent = this.renderForIds( this.rules.keys() );
	}

	/**
	 * Gera apenas o CSS referente a um subconjunto de ids — usado pelo
	 * StorageManager (Fase 9) para embutir, no HTML salvo de cada Widget
	 * HTML, somente as regras dos elementos que pertencem àquele widget.
	 *
	 * @param {Iterable<string>} ids
	 * @return {string}
	 */
	renderForIds( ids ) {
		// Materializa em lista: `ids` pode ser um iterador (rules.keys()),
		// e precisamos percorrê-lo duas vezes (fontes e regras).
		const idList = Array.from( ids );

		let css = '';

		for ( const id of idList ) {
			if ( ! this.rules.has( id ) ) {
				continue;
			}

			const breakpoints = this.rules.get( id );
			const selector = `[data-hve-style-id="${ id }"]`;

			css += this.buildBlock( selector, breakpoints.desktop );

			Object.keys( BREAKPOINT_QUERIES ).forEach( ( breakpoint ) => {
				const block = this.buildBlock( selector, breakpoints[ breakpoint ] );

				if ( block ) {
					css += `@media ${ BREAKPOINT_QUERIES[ breakpoint ] } { ${ block } }\n`;
				}
			} );
		}

		// Os `@import` das Google Fonts precisam vir ANTES de qualquer outra
		// regra, senão o navegador os ignora — por isso são prefixados aqui.
		// Assim a fonte persiste no HTML salvo, inclusive para os visitantes.
		return this.collectFontImports( idList ) + css;
	}

	/**
	 * Reúne os `@import` das Google Fonts usadas por um conjunto de ids,
	 * sem repetir a mesma fonte.
	 *
	 * @param {string[]} idList
	 * @return {string}
	 */
	collectFontImports( idList ) {
		const params = new Set();

		idList.forEach( ( id ) => {
			if ( ! this.rules.has( id ) ) {
				return;
			}

			const breakpoints = this.rules.get( id );

			[ 'desktop', 'tablet', 'mobile' ].forEach( ( name ) => {
				const family = breakpoints[ name ] && breakpoints[ name ][ 'font-family' ];
				const param = family ? googleFontParam( family ) : null;

				if ( param ) {
					params.add( param );
				}
			} );
		} );

		return Array.from( params )
			.map( ( param ) => `@import url('https://fonts.googleapis.com/css2?family=${ param }&display=swap');\n` )
			.join( '' );
	}

	/**
	 * Cada declaração leva `!important` de propósito. O editor precisa
	 * sobrepor o CSS que o próprio HTML do usuário traz (landing pages
	 * costumam ter blocos `<style>` com seletores específicos, ex.
	 * `.minha-secao h2 { font-size: 40px }`), que de outra forma venceriam
	 * o seletor de atributo `[data-hve-style-id]` por especificidade — e as
	 * mudanças de estilo simplesmente não apareceriam.
	 *
	 * @param {string} selector
	 * @param {Object<string,string>} properties
	 * @return {string}
	 */
	buildBlock( selector, properties ) {
		const entries = Object.entries( properties || {} );

		if ( ! entries.length ) {
			return '';
		}

		const declarations = entries.map( ( [ prop, value ] ) => `${ prop }: ${ value } !important;` ).join( ' ' );

		return `${ selector } { ${ declarations } }\n`;
	}
}

export default new StyleManager();
