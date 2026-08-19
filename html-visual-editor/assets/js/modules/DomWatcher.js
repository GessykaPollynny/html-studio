import { WIDGET_SELECTOR, resolveWidgetRoot } from './constants.js';

/**
 * DomWatcher — mantém a lista de Widgets HTML sincronizada com o DOM em
 * tempo real, sem jamais reprocessar o documento inteiro.
 *
 * Observa apenas inserção/remoção de nós (childList + subtree) via
 * MutationObserver e só inspeciona os nós efetivamente afetados por
 * cada mutação — nunca dispara um novo `querySelectorAll` sobre todo o
 * documento. Só fica ativo durante o modo de edição (ver Editor#start/stop).
 */
export default class DomWatcher {
	/**
	 * @param {{onWidgetAdded:(el:Element)=>void, onWidgetRemoved:(el:Element)=>void}} handlers
	 */
	constructor( handlers ) {
		this.handlers = handlers;
		this.observer = new MutationObserver( ( mutations ) => this.handleMutations( mutations ) );
	}

	/**
	 * Começa a observar o documento. Chamado apenas ao entrar no modo de edição.
	 */
	start() {
		this.observer.observe( document.body, { childList: true, subtree: true } );
	}

	/**
	 * Interrompe a observação. Chamado ao sair do modo de edição.
	 */
	stop() {
		this.observer.disconnect();
	}

	/**
	 * @param {MutationRecord[]} mutations
	 */
	handleMutations( mutations ) {
		mutations.forEach( ( mutation ) => {
			mutation.addedNodes.forEach( ( node ) => this.reportWidgets( node, this.handlers.onWidgetAdded ) );
			mutation.removedNodes.forEach( ( node ) => this.reportWidgets( node, this.handlers.onWidgetRemoved ) );
		} );
	}

	/**
	 * Verifica se o próprio nó (ou algum descendente) é um Widget HTML e
	 * notifica o callback com o root editável já resolvido — o mesmo
	 * elemento que o Editor mantém no cache, funcionando com ou sem a
	 * `.elementor-widget-container` (ver {@link resolveWidgetRoot}).
	 *
	 * @param {Node} node
	 * @param {(el:Element) => void} callback
	 */
	reportWidgets( node, callback ) {
		if ( Node.ELEMENT_NODE !== node.nodeType ) {
			return;
		}

		if ( node.matches( WIDGET_SELECTOR ) ) {
			callback( resolveWidgetRoot( node ) );
		}

		node.querySelectorAll( WIDGET_SELECTOR ).forEach( ( widget ) => callback( resolveWidgetRoot( widget ) ) );
	}
}
