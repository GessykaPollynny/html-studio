import { ICONS } from './Icons.js?ver=1.1.8';

/**
 * Toolbar — barra flutuante com o botão de entrada/saída do modo de
 * edição, desfazer/refazer e salvar.
 *
 * Não conhece SelectionManager, Panel, HistoryManager ou StorageManager
 * diretamente — apenas dispara callbacks (`onToggle`, `onUndo`, `onRedo`,
 * `onSave`) e expõe métodos para refletir o estado decidido por quem a
 * orquestra (Editor).
 */
export default class Toolbar {
	/**
	 * @param {HTMLElement} root Container onde a toolbar será montada (#hve-root).
	 * @param {Object} i18n Strings localizadas (window.hveData.i18n).
	 * @param {Function} onToggle Callback( isEditing:boolean ) chamado ao clicar no botão principal.
	 * @param {{onUndo:Function, onRedo:Function, onSave:Function}} handlers
	 */
	constructor( root, i18n, onToggle, handlers ) {
		this.root = root;
		this.i18n = i18n;
		this.onToggle = onToggle;
		this.onUndo = handlers.onUndo;
		this.onRedo = handlers.onRedo;
		this.onSave = handlers.onSave;
		this.isEditing = false;

		this.wrapper = null;
		this.button = null;
		this.undoButton = null;
		this.redoButton = null;
		this.saveButton = null;
		this.saveResetTimer = null;
	}

	/**
	 * Cria e insere a barra no DOM.
	 */
	mount() {
		this.wrapper = document.createElement( 'div' );
		this.wrapper.className = 'hve-toolbar';

		this.undoButton = this.buildHistoryButton( '↶', 'Desfazer (Ctrl+Z)', () => this.onUndo() );
		this.redoButton = this.buildHistoryButton( '↷', 'Refazer (Ctrl+Y)', () => this.onRedo() );

		this.saveButton = document.createElement( 'button' );
		this.saveButton.type = 'button';
		this.saveButton.className = 'hve-toolbar__save';
		this.saveButton.textContent = this.i18n.save;
		this.saveButton.hidden = true;
		this.saveButton.addEventListener( 'click', () => this.onSave() );

		this.button = document.createElement( 'button' );
		this.button.type = 'button';
		this.button.className = 'hve-toolbar__toggle';
		this.button.setAttribute( 'aria-pressed', 'false' );
		this.setLabel();
		this.button.addEventListener( 'click', () => this.handleClick() );

		this.wrapper.appendChild( this.undoButton );
		this.wrapper.appendChild( this.redoButton );
		this.wrapper.appendChild( this.saveButton );
		this.wrapper.appendChild( this.button );

		this.root.appendChild( this.wrapper );
	}

	/**
	 * @param {string} label
	 * @param {string} title
	 * @param {() => void} onClick
	 * @return {HTMLButtonElement}
	 */
	buildHistoryButton( label, title, onClick ) {
		const button = document.createElement( 'button' );
		button.type = 'button';
		button.className = 'hve-toolbar__history';
		button.title = title;
		button.textContent = label;
		button.hidden = true;
		button.disabled = true;
		button.addEventListener( 'click', onClick );

		return button;
	}

	/**
	 * Alterna o estado interno, atualiza o rótulo e notifica o Editor.
	 */
	handleClick() {
		this.isEditing = ! this.isEditing;
		this.setLabel();
		this.button.setAttribute( 'aria-pressed', String( this.isEditing ) );
		this.button.classList.toggle( 'hve-toolbar__toggle--active', this.isEditing );

		this.undoButton.hidden = ! this.isEditing;
		this.redoButton.hidden = ! this.isEditing;
		this.saveButton.hidden = ! this.isEditing;

		this.onToggle( this.isEditing );
	}

	/**
	 * Atualiza o texto do botão conforme o estado atual.
	 */
	setLabel() {
		if ( this.isEditing ) {
			this.button.textContent = this.i18n.exitEditMode;
			return;
		}

		// "Editar HTML" ganha o ícone de lápis; "Sair da edição" fica só texto.
		this.button.innerHTML = ICONS.content;

		const label = document.createElement( 'span' );
		label.textContent = this.i18n.editHtml;
		this.button.appendChild( label );
	}

	/**
	 * Sincroniza os botões de desfazer/refazer com o HistoryManager.
	 *
	 * @param {{canUndo:boolean,canRedo:boolean}} state
	 */
	setHistoryState( state ) {
		this.undoButton.disabled = ! state.canUndo;
		this.redoButton.disabled = ! state.canRedo;
	}

	/**
	 * Reflete o estado da última chamada a StorageManager#save no botão
	 * Salvar. 'saved' e 'error' voltam a 'idle' automaticamente após um
	 * curto período, para não deixar o rótulo preso.
	 *
	 * @param {'idle'|'saving'|'saved'|'error'} state
	 */
	setSaveState( state ) {
		clearTimeout( this.saveResetTimer );

		this.saveButton.classList.remove( 'hve-toolbar__save--saved', 'hve-toolbar__save--error' );
		this.saveButton.disabled = 'saving' === state;

		const labels = {
			idle: this.i18n.save,
			saving: this.i18n.saving,
			saved: this.i18n.saved,
			error: this.i18n.saveError,
		};

		this.saveButton.textContent = labels[ state ] || this.i18n.save;

		if ( 'saved' === state ) {
			this.saveButton.classList.add( 'hve-toolbar__save--saved' );
		} else if ( 'error' === state ) {
			this.saveButton.classList.add( 'hve-toolbar__save--error' );
		}

		if ( 'saved' === state || 'error' === state ) {
			this.saveResetTimer = setTimeout( () => this.setSaveState( 'idle' ), 2500 );
		}
	}
}
