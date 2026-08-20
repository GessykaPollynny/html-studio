import { SUPPORTED_TAGS } from './SupportedElements.js?ver=1.1.7';

/**
 * DOMInspector — utilitário estático de leitura da árvore DOM.
 *
 * Não guarda estado; apenas responde perguntas sobre a estrutura do
 * conteúdo do Widget HTML (é suportado? quem é o pai suportado mais
 * próximo? qual a cadeia de ancestrais? quais os filhos selecionáveis?).
 */
export default class DOMInspector {
	/**
	 * Indica se um elemento pertence à lista de tags suportadas.
	 *
	 * @param {Element|null} element
	 */
	static isSupported( element ) {
		return !! element && element.nodeType === Node.ELEMENT_NODE && SUPPORTED_TAGS.has( element.tagName.toLowerCase() );
	}

	/**
	 * Sobe a árvore a partir de `target` até encontrar o primeiro
	 * ancestral (ou o próprio elemento) que seja suportado, sem
	 * ultrapassar `root`.
	 *
	 * @param {Element} target
	 * @param {Element} root
	 * @return {Element|null}
	 */
	static closestSupported( target, root ) {
		let node = target;

		while ( node && node !== root.parentElement ) {
			if ( this.isSupported( node ) ) {
				return node;
			}

			if ( node === root ) {
				break;
			}

			node = node.parentElement;
		}

		return null;
	}

	/**
	 * Monta a cadeia de ancestrais suportados entre `root` e `element`
	 * (inclusive), na ordem raiz -> elemento.
	 *
	 * @param {Element} element
	 * @param {Element} root
	 * @return {Element[]}
	 */
	static getBreadcrumb( element, root ) {
		const chain = [];
		let node = element;

		while ( node && root.contains( node ) ) {
			if ( this.isSupported( node ) || node === root ) {
				chain.unshift( node );
			}

			if ( node === root ) {
				break;
			}

			node = node.parentElement;
		}

		return chain;
	}

	/**
	 * Lista os filhos diretos suportados de um elemento.
	 *
	 * @param {Element} element
	 * @return {Element[]}
	 */
	static getSelectableChildren( element ) {
		return Array.from( element.children ).filter( ( child ) => this.isSupported( child ) );
	}

	/**
	 * Gera um rótulo curto e legível para exibir no breadcrumb/painel.
	 *
	 * @param {Element} element
	 * @return {string}
	 */
	static describe( element ) {
		const tag = element.tagName.toLowerCase();
		const id = element.id ? `#${ element.id }` : '';

		if ( id ) {
			return `${ tag }${ id }`;
		}

		const firstClass = Array.from( element.classList ).find( ( cls ) => 0 !== cls.indexOf( 'hve-' ) );

		return firstClass ? `${ tag }.${ firstClass }` : tag;
	}
}
