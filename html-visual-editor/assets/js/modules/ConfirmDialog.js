/**
 * ConfirmDialog — modal de confirmação para ações destrutivas.
 *
 * Existe para que nenhuma ação irreversível (excluir um elemento, por
 * exemplo) aconteça com um único clique acidental. O método {@link ask}
 * devolve uma Promise que resolve `true` somente se o usuário confirmar
 * explicitamente; qualquer outra saída (Cancelar, Esc, clique no fundo)
 * resolve `false`.
 *
 * Todo texto é inserido via `textContent` — nunca `innerHTML`.
 */
export default class ConfirmDialog {
	/**
	 * @param {HTMLElement} root Container raiz do editor (#hve-root).
	 */
	constructor( root ) {
		this.root = root;
		this.element = null;
		this.titleElement = null;
		this.messageElement = null;
		this.confirmButton = null;
		this.cancelButton = null;
		this.resolver = null;

		this.handleKeydown = ( event ) => {
			if ( 'Escape' === event.key ) {
				this.settle( false );
			}
		};
	}

	/**
	 * Monta (uma única vez) a estrutura do modal, inicialmente oculta.
	 */
	mount() {
		if ( this.element ) {
			return;
		}

		this.element = document.createElement( 'div' );
		this.element.className = 'hve-confirm';
		this.element.hidden = true;
		this.element.setAttribute( 'role', 'dialog' );
		this.element.setAttribute( 'aria-modal', 'true' );

		// Clique no fundo (fora da caixa) cancela.
		this.element.addEventListener( 'click', ( event ) => {
			if ( event.target === this.element ) {
				this.settle( false );
			}
		} );

		const box = document.createElement( 'div' );
		box.className = 'hve-confirm__box';

		this.titleElement = document.createElement( 'h2' );
		this.titleElement.className = 'hve-confirm__title';
		box.appendChild( this.titleElement );

		this.messageElement = document.createElement( 'p' );
		this.messageElement.className = 'hve-confirm__message';
		box.appendChild( this.messageElement );

		const actions = document.createElement( 'div' );
		actions.className = 'hve-confirm__actions';

		this.cancelButton = document.createElement( 'button' );
		this.cancelButton.type = 'button';
		this.cancelButton.className = 'hve-confirm__button hve-confirm__button--cancel';
		this.cancelButton.addEventListener( 'click', () => this.settle( false ) );
		actions.appendChild( this.cancelButton );

		this.confirmButton = document.createElement( 'button' );
		this.confirmButton.type = 'button';
		this.confirmButton.className = 'hve-confirm__button hve-confirm__button--confirm';
		this.confirmButton.addEventListener( 'click', () => this.settle( true ) );
		actions.appendChild( this.confirmButton );

		box.appendChild( actions );
		this.element.appendChild( box );
		this.root.appendChild( this.element );
	}

	/**
	 * Abre o modal e aguarda a decisão do usuário.
	 *
	 * @param {Object} options
	 * @param {string} [options.title]        Título da caixa.
	 * @param {string} [options.message]      Texto explicativo.
	 * @param {string} [options.confirmLabel] Rótulo do botão de confirmação.
	 * @param {string} [options.cancelLabel]  Rótulo do botão de cancelamento.
	 * @param {boolean} [options.danger]      Destaca o botão como destrutivo.
	 * @return {Promise<boolean>}
	 */
	ask( options = {} ) {
		if ( ! this.element ) {
			return Promise.resolve( false );
		}

		// Uma pergunta anterior ainda aberta é cancelada antes da nova —
		// nunca deixamos uma Promise pendente sem resposta.
		this.settle( false );

		this.titleElement.textContent = options.title || 'Confirmar ação';
		this.messageElement.textContent = options.message || 'Deseja continuar?';
		this.confirmButton.textContent = options.confirmLabel || 'Confirmar';
		this.cancelButton.textContent = options.cancelLabel || 'Cancelar';

		this.confirmButton.classList.toggle( 'hve-confirm__button--danger', !! options.danger );

		this.element.hidden = false;
		document.addEventListener( 'keydown', this.handleKeydown, true );

		// O foco começa em Cancelar: a tecla Enter, por reflexo, não
		// dispara a ação destrutiva.
		this.cancelButton.focus();

		return new Promise( ( resolve ) => {
			this.resolver = resolve;
		} );
	}

	/**
	 * Fecha o modal e resolve a Promise pendente, se houver.
	 *
	 * @param {boolean} result
	 */
	settle( result ) {
		if ( ! this.resolver ) {
			return;
		}

		const resolve = this.resolver;
		this.resolver = null;

		this.element.hidden = true;
		document.removeEventListener( 'keydown', this.handleKeydown, true );

		resolve( result );
	}

	/**
	 * Remove o modal do DOM, cancelando qualquer pergunta pendente.
	 */
	unmount() {
		if ( ! this.element ) {
			return;
		}

		this.settle( false );
		this.element.remove();
		this.element = null;
	}
}
