/**
 * Notifications — feedback não bloqueante para o usuário do editor.
 *
 * Empilha mensagens temporárias ("toasts") num canto da tela, fora do
 * caminho da toolbar flutuante e do painel lateral. Cada mensagem some
 * sozinha após alguns segundos e pode ser fechada manualmente.
 *
 * O texto é sempre inserido via `textContent` — nunca `innerHTML` — para
 * que nenhuma mensagem possa injetar marcação na página do site.
 */
export default class Notifications {
	/**
	 * @param {HTMLElement} root Container raiz do editor (#hve-root).
	 */
	constructor( root ) {
		this.root = root;
		this.listElement = null;
	}

	/**
	 * Cria (uma única vez) o container que empilha as notificações.
	 */
	mount() {
		if ( this.listElement ) {
			return;
		}

		this.listElement = document.createElement( 'div' );
		this.listElement.className = 'hve-notifications';

		// Leitores de tela anunciam as mensagens sem roubar o foco.
		this.listElement.setAttribute( 'role', 'status' );
		this.listElement.setAttribute( 'aria-live', 'polite' );

		this.root.appendChild( this.listElement );
	}

	/**
	 * Exibe uma notificação.
	 *
	 * @param {string} message  Texto exibido.
	 * @param {string} type     'info' | 'success' | 'error'.
	 * @param {number} duration Tempo em ms até sumir sozinha (0 = fixa).
	 * @return {HTMLElement|null} O elemento criado, ou null se não montado.
	 */
	show( message, type = 'info', duration = 4000 ) {
		if ( ! this.listElement ) {
			return null;
		}

		const item = document.createElement( 'div' );
		item.className = `hve-notification hve-notification--${ type }`;

		const text = document.createElement( 'span' );
		text.className = 'hve-notification__text';
		text.textContent = message;
		item.appendChild( text );

		const closeButton = document.createElement( 'button' );
		closeButton.type = 'button';
		closeButton.className = 'hve-notification__close';
		closeButton.setAttribute( 'aria-label', 'Fechar notificação' );
		closeButton.textContent = '×';
		closeButton.addEventListener( 'click', () => this.dismiss( item ) );
		item.appendChild( closeButton );

		this.listElement.appendChild( item );

		// A classe de visibilidade entra num frame seguinte para a
		// transição de entrada acontecer (sem ela o elemento já nasceria
		// no estado final e a animação seria pulada).
		requestAnimationFrame( () => item.classList.add( 'hve-notification--visible' ) );

		if ( duration > 0 ) {
			setTimeout( () => this.dismiss( item ), duration );
		}

		return item;
	}

	/**
	 * @param {string} message
	 * @return {HTMLElement|null}
	 */
	success( message ) {
		return this.show( message, 'success' );
	}

	/**
	 * Erros ficam mais tempo na tela — o usuário precisa conseguir ler.
	 *
	 * @param {string} message
	 * @return {HTMLElement|null}
	 */
	error( message ) {
		return this.show( message, 'error', 7000 );
	}

	/**
	 * Remove uma notificação, dando tempo para a transição de saída.
	 *
	 * @param {HTMLElement} item
	 */
	dismiss( item ) {
		if ( ! item || ! item.isConnected ) {
			return;
		}

		item.classList.remove( 'hve-notification--visible' );
		setTimeout( () => item.remove(), 200 );
	}

	/**
	 * Remove o container e todas as notificações pendentes.
	 */
	unmount() {
		if ( ! this.listElement ) {
			return;
		}

		this.listElement.remove();
		this.listElement = null;
	}
}
