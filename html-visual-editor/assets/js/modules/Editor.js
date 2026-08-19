import Toolbar from './Toolbar.js';
import SelectionManager from './SelectionManager.js';
import Breadcrumb from './Breadcrumb.js';
import DOMInspector from './DOMInspector.js';
import Panel from './Panel.js';
import LayoutTab from './tabs/LayoutTab.js';
import ResponsiveTab from './tabs/ResponsiveTab.js';
import ContentTab from './tabs/ContentTab.js';
import ImagesTab from './tabs/ImagesTab.js';
import StyleTab from './tabs/StyleTab.js';
import HistoryManager from './HistoryManager.js';
import KeyboardShortcuts from './KeyboardShortcuts.js';
import StorageManager from './StorageManager.js';
import DomWatcher from './DomWatcher.js';
import Notifications from './Notifications.js';
import ConfirmDialog from './ConfirmDialog.js';
import { WIDGET_SELECTOR, resolveWidgetRoot } from './constants.js';

const PANEL_TABS = [
	{ id: 'content', label: 'Conteúdo' },
	{ id: 'images', label: 'Imagens' },
	{ id: 'style', label: 'Estilo' },
	{ id: 'layout', label: 'Layout' },
	{ id: 'responsive', label: 'Responsivo' },
];

/**
 * Editor — orquestrador central do modo de edição.
 *
 * Controla a transição view <-> edição, mantém os elementos editáveis
 * marcados no DOM e conecta seleção, breadcrumb, painel lateral,
 * histórico (undo/redo) e atalhos de teclado.
 */
export default class Editor {
	/**
	 * @param {HTMLElement} root Container raiz da aplicação (#hve-root).
	 * @param {Object} config Dados localizados (window.hveData).
	 */
	constructor( root, config ) {
		this.root = root;
		this.config = config;
		this.isEditing = false;
		this.history = null;

		/**
		 * Cache em memória dos containers de Widget HTML atualmente
		 * editáveis. Calculado uma única vez ao entrar em modo de edição
		 * e mantido sincronizado pelo DomWatcher — nunca reconsultado via
		 * querySelectorAll no caminho de eventos de mouse (hover/click),
		 * que dispara centenas de vezes por interação.
		 *
		 * @type {Element[]}
		 */
		this.editableRootsCache = [];

		this.toolbar = new Toolbar( root, config.i18n, ( editing ) => this.setEditing( editing ), {
			onUndo: () => this.undo(),
			onRedo: () => this.redo(),
			onSave: () => this.save(),
		} );
		this.selection = new SelectionManager( () => this.getEditableRoots() );
		this.domWatcher = new DomWatcher( {
			onWidgetAdded: ( container ) => this.handleWidgetAdded( container ),
			onWidgetRemoved: ( container ) => this.handleWidgetRemoved( container ),
		} );
		this.breadcrumb = new Breadcrumb( root, ( element ) => this.reselect( element ) );
		this.panel = new Panel( root, PANEL_TABS, () => this.selection.clearSelection() );
		this.shortcuts = new KeyboardShortcuts( () => this.isEditing, {
			undo: () => this.undo(),
			redo: () => this.redo(),
		} );
		this.storage = new StorageManager( config, () => this.getEditableRoots() );
		this.notifications = new Notifications( root );
		this.confirmDialog = new ConfirmDialog( root );
	}

	/**
	 * Inicializa toolbar, breadcrumb, painel e os listeners de seleção.
	 * Chamado uma única vez pela aplicação.
	 */
	init() {
		this.toolbar.mount();
		this.breadcrumb.mount();
		this.panel.mount();
		this.notifications.mount();
		this.confirmDialog.mount();

		this.panel.setReselectHandler( ( element ) => this.reselect( element ) );
		this.panel.setChangeHandler( () => this.handleStructuralChange() );
		this.panel.setConfirmHandler( ( options ) => this.confirmDialog.ask( options ) );

		this.registerPanelTabs();

		this.selection.addEventListener( 'select', ( event ) => {
			this.breadcrumb.render( event.detail.breadcrumb );
			this.panel.show( event.detail );
		} );

		this.selection.addEventListener( 'deselect', () => {
			this.breadcrumb.hide();
			this.panel.hide();
		} );
	}

	/**
	 * Registra o renderer de cada aba do painel lateral.
	 */
	registerPanelTabs() {
		this.panel.registerTab( 'content', new ContentTab() );
		this.panel.registerTab( 'images', new ImagesTab() );
		this.panel.registerTab( 'style', new StyleTab() );
		this.panel.registerTab( 'layout', new LayoutTab() );
		this.panel.registerTab( 'responsive', new ResponsiveTab() );
	}

	/**
	 * Reseleciona um elemento (usado pelo breadcrumb e pelas ações de layout).
	 *
	 * @param {Element} element
	 */
	reselect( element ) {
		const targetRoot = element.closest( '[data-hve-editable-root]' ) || element;
		this.selection.select( element, targetRoot );
	}

	/**
	 * Chamado sempre que uma aba altera a estrutura do DOM (duplicar,
	 * excluir, mover, editar conteúdo/imagem/estilo...). Re-renderiza o
	 * breadcrumb e agenda um snapshot no histórico.
	 */
	handleStructuralChange() {
		if ( ! this.selection.selected || ! this.selection.selectedRoot ) {
			this.breadcrumb.hide();
		} else {
			this.breadcrumb.render(
				DOMInspector.getBreadcrumb( this.selection.selected, this.selection.selectedRoot )
			);
		}

		if ( this.history ) {
			this.history.scheduleSnapshot();
		}
	}

	/**
	 * Desfaz a última alteração. A seleção é sempre limpa em seguida, pois
	 * a restauração do HTML invalida as referências de elemento anteriores.
	 */
	undo() {
		if ( ! this.history ) {
			return;
		}

		this.history.undo();
		this.selection.clearSelection();
	}

	/**
	 * Refaz a última alteração desfeita.
	 */
	redo() {
		if ( ! this.history ) {
			return;
		}

		this.history.redo();
		this.selection.clearSelection();
	}

	/**
	 * Persiste o estado atual de todos os Widgets HTML no servidor.
	 */
	async save() {
		this.toolbar.setSaveState( 'saving' );

		try {
			await this.storage.save();
			this.toolbar.setSaveState( 'saved' );
			this.notifications.success( this.config.i18n.saved );
		} catch ( error ) {
			this.toolbar.setSaveState( 'error' );
			this.notifications.error( this.config.i18n.saveError );
		}
	}

	/**
	 * Liga/desliga o modo de edição.
	 *
	 * @param {boolean} editing Novo estado desejado.
	 */
	setEditing( editing ) {
		this.isEditing = editing;

		document.body.classList.toggle( 'hve-editing', editing );

		if ( editing ) {
			this.markEditableWidgets();
			this.domWatcher.start();
			this.selection.enable();
			this.shortcuts.enable();

			this.history = new HistoryManager( () => this.getEditableRoots() );
			this.history.addEventListener( 'change', ( event ) => this.toolbar.setHistoryState( event.detail ) );
			this.history.init();
		} else {
			this.domWatcher.stop();
			this.selection.disable();
			this.shortcuts.disable();
			this.breadcrumb.hide();
			this.unmarkEditableWidgets();
			this.history = null;
		}
	}

	/**
	 * Varredura única do documento ao entrar no modo de edição: marca
	 * cada Widget HTML já presente e povoa o cache. Depois disso, apenas
	 * o DomWatcher decide o que entra/sai do cache.
	 */
	markEditableWidgets() {
		this.editableRootsCache = Array.from( document.querySelectorAll( WIDGET_SELECTOR ) )
			.map( ( widget ) => resolveWidgetRoot( widget ) );

		this.editableRootsCache.forEach( ( root ) => {
			root.setAttribute( 'data-hve-editable-root', 'true' );
		} );
	}

	/**
	 * Remove os marcadores de edição ao sair do modo de edição, a partir
	 * do cache (sem reconsultar o DOM).
	 */
	unmarkEditableWidgets() {
		this.editableRootsCache.forEach( ( container ) => {
			container.removeAttribute( 'data-hve-editable-root' );
		} );

		this.editableRootsCache = [];
	}

	/**
	 * Chamado pelo DomWatcher quando um novo Widget HTML aparece no DOM
	 * (ex.: conteúdo carregado dinamicamente após o modo de edição já
	 * estar ativo, como um popup do Elementor).
	 *
	 * @param {Element} container
	 */
	handleWidgetAdded( container ) {
		if ( this.editableRootsCache.includes( container ) ) {
			return;
		}

		container.setAttribute( 'data-hve-editable-root', 'true' );
		this.editableRootsCache.push( container );
	}

	/**
	 * Chamado pelo DomWatcher quando um Widget HTML é removido do DOM.
	 * Limpa a seleção se o elemento selecionado pertencia a ele.
	 *
	 * @param {Element} container
	 */
	handleWidgetRemoved( container ) {
		this.editableRootsCache = this.editableRootsCache.filter( ( root ) => root !== container );

		if ( this.selection.selectedRoot === container ) {
			this.selection.clearSelection();
		}
	}

	/**
	 * Retorna os containers atualmente marcados como editáveis, a partir
	 * do cache em memória — nunca via querySelectorAll no caminho de
	 * eventos de mouse.
	 *
	 * @return {Element[]}
	 */
	getEditableRoots() {
		return this.editableRootsCache;
	}
}
