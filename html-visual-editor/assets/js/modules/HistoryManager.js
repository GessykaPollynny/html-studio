import StyleManager from './StyleManager.js?ver=1.1.8';

const MAX_HISTORY_SIZE = 50;
const DEBOUNCE_MS = 500;

/**
 * HistoryManager — undo/redo por snapshot (memento), não por comandos
 * individuais. A cada alteração relevante (estrutura, conteúdo, imagem
 * ou estilo), um snapshot com o HTML de cada Widget HTML e as regras do
 * StyleManager é agendado; snapshots consecutivos disparados por digitação
 * rápida são agrupados (debounce) num único passo de histórico.
 *
 * Dispara o evento `change` sempre que a disponibilidade de undo/redo
 * muda, para a Toolbar (Fase 2) manter os botões sincronizados.
 */
export default class HistoryManager extends EventTarget {
	/**
	 * @param {() => Element[]} getRoots Função que retorna os containers editáveis atuais.
	 */
	constructor( getRoots ) {
		super();

		this.getRoots = getRoots;
		this.undoStack = [];
		this.redoStack = [];
		this.debounceTimer = null;
		this.isRestoring = false;
	}

	/**
	 * Captura o estado inicial ao entrar no modo de edição.
	 */
	init() {
		this.undoStack = [ this.captureSnapshot() ];
		this.redoStack = [];
		this.notifyChange();
	}

	/**
	 * Agenda a captura de um novo snapshot, agrupando alterações rápidas
	 * (ex.: digitação) num único passo de histórico.
	 */
	scheduleSnapshot() {
		if ( this.isRestoring ) {
			return;
		}

		clearTimeout( this.debounceTimer );
		this.debounceTimer = setTimeout( () => this.pushSnapshot(), DEBOUNCE_MS );
	}

	/**
	 * Grava imediatamente um snapshot do estado atual, se diferente do topo da pilha.
	 */
	pushSnapshot() {
		const snapshot = this.captureSnapshot();
		const top = this.undoStack[ this.undoStack.length - 1 ];

		if ( top && this.serialize( top ) === this.serialize( snapshot ) ) {
			return;
		}

		this.undoStack.push( snapshot );

		if ( this.undoStack.length > MAX_HISTORY_SIZE ) {
			this.undoStack.shift();
		}

		this.redoStack = [];
		this.notifyChange();
	}

	/**
	 * Desfaz a última alteração, restaurando o snapshot anterior.
	 */
	undo() {
		clearTimeout( this.debounceTimer );

		if ( this.undoStack.length < 2 ) {
			return;
		}

		const current = this.undoStack.pop();
		this.redoStack.push( current );

		this.restoreSnapshot( this.undoStack[ this.undoStack.length - 1 ] );
		this.notifyChange();
	}

	/**
	 * Refaz a última alteração desfeita.
	 */
	redo() {
		if ( ! this.redoStack.length ) {
			return;
		}

		const next = this.redoStack.pop();
		this.undoStack.push( next );

		this.restoreSnapshot( next );
		this.notifyChange();
	}

	/**
	 * @return {{canUndo:boolean,canRedo:boolean}}
	 */
	getState() {
		return {
			canUndo: this.undoStack.length > 1,
			canRedo: this.redoStack.length > 0,
		};
	}

	/**
	 * @return {{roots:string[],styles:Object}}
	 */
	captureSnapshot() {
		return {
			roots: this.getRoots().map( ( root ) => root.innerHTML ),
			styles: StyleManager.exportRules(),
		};
	}

	/**
	 * @param {{roots:string[],styles:Object}} snapshot
	 */
	restoreSnapshot( snapshot ) {
		this.isRestoring = true;

		this.getRoots().forEach( ( root, index ) => {
			if ( undefined !== snapshot.roots[ index ] ) {
				root.innerHTML = snapshot.roots[ index ];
			}
		} );

		StyleManager.importRules( snapshot.styles );

		this.isRestoring = false;
	}

	/**
	 * @param {Object} snapshot
	 * @return {string}
	 */
	serialize( snapshot ) {
		return JSON.stringify( snapshot );
	}

	notifyChange() {
		this.dispatchEvent( new CustomEvent( 'change', { detail: this.getState() } ) );
	}
}
