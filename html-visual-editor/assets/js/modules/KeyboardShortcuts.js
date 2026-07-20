/**
 * KeyboardShortcuts — atalhos globais de teclado do modo de edição.
 *
 * Captura Ctrl+Z (desfazer) e Ctrl+Y / Ctrl+Shift+Z (refazer) com
 * `preventDefault`, substituindo o undo nativo do navegador para
 * elementos contenteditable — o HistoryManager passa a ser a única
 * fonte de verdade do histórico, cobrindo estrutura, conteúdo e estilo
 * de forma consistente.
 */
export default class KeyboardShortcuts {
	/**
	 * @param {() => boolean} isActive Retorna se os atalhos devem agir agora (modo de edição ligado).
	 * @param {{undo:() => void, redo:() => void}} handlers
	 */
	constructor( isActive, handlers ) {
		this.isActive = isActive;
		this.handlers = handlers;
		this.handleKeyDown = this.handleKeyDown.bind( this );
	}

	enable() {
		document.addEventListener( 'keydown', this.handleKeyDown, true );
	}

	disable() {
		document.removeEventListener( 'keydown', this.handleKeyDown, true );
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	handleKeyDown( event ) {
		if ( ! this.isActive() ) {
			return;
		}

		const isMac = navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;
		const hasModifier = isMac ? event.metaKey : event.ctrlKey;

		if ( ! hasModifier ) {
			return;
		}

		const key = event.key.toLowerCase();

		if ( 'z' === key && ! event.shiftKey ) {
			event.preventDefault();
			this.handlers.undo();
			return;
		}

		if ( 'y' === key || ( 'z' === key && event.shiftKey ) ) {
			event.preventDefault();
			this.handlers.redo();
		}
	}
}
