import DOMInspector from './DOMInspector.js';

/**
 * Panel — casca genérica do painel lateral com abas.
 *
 * Não conhece o conteúdo de nenhuma aba: cada aba é um "renderer"
 * registrado via {@link Panel#registerTab}, com a interface:
 *   - mount( container:HTMLElement, context:Object ): void
 *   - unmount(): void                  (opcional)
 *
 * Essa indireção permite que Content/Image/Style (Fases 5-7) sejam
 * implementadas e trocadas sem qualquer alteração nesta classe.
 */
export default class Panel {
	/**
	 * @param {HTMLElement} root Container onde o painel será montado (#hve-root).
	 * @param {Array<{id:string,label:string}>} tabs Definição das abas, na ordem de exibição.
	 * @param {() => void} onClose Chamado quando o usuário fecha o painel.
	 */
	constructor( root, tabs, onClose ) {
		this.root = root;
		this.tabDefinitions = tabs;
		this.onClose = onClose;

		this.renderers = new Map();
		this.activeTabId = tabs.length ? tabs[ 0 ].id : null;
		this.currentContext = null;

		this.element = null;
		this.bodyElement = null;
		this.tabButtons = new Map();

		this.onReselect = () => {};
		this.onChange = () => {};
	}

	/**
	 * Associa um renderer a uma aba.
	 *
	 * @param {string} tabId
	 * @param {{mount:Function,update?:Function,unmount?:Function}} renderer
	 */
	registerTab( tabId, renderer ) {
		this.renderers.set( tabId, renderer );
	}

	/**
	 * Constrói a estrutura DOM do painel (inicialmente oculto).
	 */
	mount() {
		this.element = document.createElement( 'aside' );
		this.element.className = 'hve-panel';
		this.element.hidden = true;

		this.element.appendChild( this.buildHeader() );
		this.element.appendChild( this.buildTabNav() );

		this.bodyElement = document.createElement( 'div' );
		this.bodyElement.className = 'hve-panel__body';
		this.element.appendChild( this.bodyElement );

		this.root.appendChild( this.element );
	}

	/**
	 * @return {HTMLElement}
	 */
	buildHeader() {
		const header = document.createElement( 'div' );
		header.className = 'hve-panel__header';

		this.titleElement = document.createElement( 'span' );
		this.titleElement.className = 'hve-panel__title';
		header.appendChild( this.titleElement );

		const closeButton = document.createElement( 'button' );
		closeButton.type = 'button';
		closeButton.className = 'hve-panel__close';
		closeButton.setAttribute( 'aria-label', 'Fechar painel' );
		closeButton.textContent = '×';
		closeButton.addEventListener( 'click', () => this.onClose() );
		header.appendChild( closeButton );

		return header;
	}

	/**
	 * @return {HTMLElement}
	 */
	buildTabNav() {
		const nav = document.createElement( 'nav' );
		nav.className = 'hve-panel__tabs';

		this.tabDefinitions.forEach( ( tab ) => {
			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'hve-panel__tab';
			button.textContent = tab.label;
			button.addEventListener( 'click', () => this.setActiveTab( tab.id ) );

			this.tabButtons.set( tab.id, button );
			nav.appendChild( button );
		} );

		return nav;
	}

	/**
	 * Exibe o painel com o contexto do elemento selecionado.
	 *
	 * Sempre desmonta o renderer ativo antes de trocar o contexto: mesmo
	 * que a aba continue a mesma, o elemento por trás dela mudou, e
	 * renderers com estado (ex.: ContentTab, que liga contenteditable a
	 * um elemento específico) precisam ser limpos corretamente.
	 *
	 * @param {{element:Element,root:Element,breadcrumb:Element[],children:Element[]}} selectionDetail
	 */
	show( selectionDetail ) {
		this.unmountActiveRenderer();

		this.currentContext = this.buildContext( selectionDetail );
		this.titleElement.textContent = DOMInspector.describe( selectionDetail.element );
		this.element.hidden = false;

		this.mountActiveTab( this.activeTabId || this.tabDefinitions[ 0 ].id );
	}

	/**
	 * Oculta o painel e desmonta a aba ativa.
	 */
	hide() {
		if ( ! this.element || this.element.hidden ) {
			return;
		}

		this.unmountActiveRenderer();

		this.bodyElement.innerHTML = '';
		this.element.hidden = true;
		this.currentContext = null;
	}

	/**
	 * Troca a aba ativa (chamado pelos botões de navegação).
	 *
	 * @param {string} tabId
	 */
	setActiveTab( tabId ) {
		if ( ! this.currentContext || tabId === this.activeTabId ) {
			return;
		}

		this.unmountActiveRenderer();
		this.mountActiveTab( tabId );
	}

	/**
	 * Desmonta o renderer atualmente ativo, se houver um contexto montado.
	 */
	unmountActiveRenderer() {
		if ( ! this.currentContext ) {
			return;
		}

		const renderer = this.renderers.get( this.activeTabId );

		if ( renderer && renderer.unmount ) {
			renderer.unmount();
		}
	}

	/**
	 * Ativa uma aba e monta seu renderer com o contexto atual.
	 *
	 * @param {string} tabId
	 */
	mountActiveTab( tabId ) {
		this.activeTabId = tabId;

		this.tabButtons.forEach( ( button, id ) => {
			button.classList.toggle( 'hve-panel__tab--active', id === tabId );
		} );

		this.bodyElement.innerHTML = '';

		const renderer = this.renderers.get( tabId );

		if ( renderer ) {
			renderer.mount( this.bodyElement, this.currentContext );
		}
	}

	/**
	 * Monta o objeto de contexto repassado a cada renderer de aba.
	 *
	 * @param {{element:Element,root:Element,breadcrumb:Element[],children:Element[]}} selectionDetail
	 * @return {Object}
	 */
	buildContext( selectionDetail ) {
		return {
			element: selectionDetail.element,
			root: selectionDetail.root,
			breadcrumb: selectionDetail.breadcrumb,
			children: selectionDetail.children,
			reselect: ( element ) => this.onReselect( element ),
			deselect: () => this.onClose(),
			notifyChange: () => this.onChange(),
			confirm: ( options ) => this.onConfirm( options ),
		};
	}

	/**
	 * Confirmação padrão, usada enquanto o Editor não injeta o modal
	 * próprio. Recorre ao `window.confirm` nativo de propósito: é
	 * preferível uma caixa feia a uma ação destrutiva sem pergunta —
	 * e também a um botão que simplesmente não funciona.
	 *
	 * @param {{message?: string}} options
	 * @return {Promise<boolean>}
	 */
	onConfirm( options = {} ) {
		return Promise.resolve( window.confirm( options.message || 'Deseja continuar?' ) );
	}

	/**
	 * @param {(options: Object) => Promise<boolean>} handler
	 */
	setConfirmHandler( handler ) {
		this.onConfirm = handler;
	}

	/**
	 * @param {(element: Element) => void} handler
	 */
	setReselectHandler( handler ) {
		this.onReselect = handler;
	}

	/**
	 * @param {() => void} handler
	 */
	setChangeHandler( handler ) {
		this.onChange = handler;
	}
}
