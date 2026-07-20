/**
 * Testes do sistema de notificações (toasts) do editor.
 */

import Notifications from '../html-visual-editor/assets/js/modules/Notifications.js';

/**
 * @return {Notifications}
 */
function mountNotifications() {
	const root = document.createElement( 'div' );
	document.body.appendChild( root );

	const notifications = new Notifications( root );
	notifications.mount();

	return notifications;
}

afterEach( () => {
	document.body.innerHTML = '';
} );

describe( 'Notifications', () => {
	test( 'monta o container acessível uma única vez', () => {
		const notifications = mountNotifications();
		notifications.mount();

		const containers = document.querySelectorAll( '.hve-notifications' );
		expect( containers ).toHaveLength( 1 );
		expect( containers[ 0 ].getAttribute( 'aria-live' ) ).toBe( 'polite' );
	} );

	test( 'exibe a mensagem informada', () => {
		mountNotifications().show( 'Tudo certo' );

		expect( document.querySelector( '.hve-notification__text' ).textContent ).toBe( 'Tudo certo' );
	} );

	test( 'aplica a variação visual de sucesso e de erro', () => {
		const notifications = mountNotifications();

		notifications.success( 'ok' );
		notifications.error( 'falhou' );

		expect( document.querySelector( '.hve-notification--success' ) ).not.toBeNull();
		expect( document.querySelector( '.hve-notification--error' ) ).not.toBeNull();
	} );

	test( 'empilha várias notificações', () => {
		const notifications = mountNotifications();

		notifications.show( 'um' );
		notifications.show( 'dois' );

		expect( document.querySelectorAll( '.hve-notification' ) ).toHaveLength( 2 );
	} );

	test( 'usa textContent — não interpreta HTML da mensagem', () => {
		mountNotifications().show( '<img src=x onerror=alert(1)>' );

		const text = document.querySelector( '.hve-notification__text' );
		expect( text.querySelector( 'img' ) ).toBeNull();
		expect( text.textContent ).toBe( '<img src=x onerror=alert(1)>' );
	} );

	test( 'o botão fechar remove a notificação', () => {
		jest.useFakeTimers();

		const notifications = mountNotifications();
		notifications.show( 'some daqui', 'info', 0 );

		document.querySelector( '.hve-notification__close' ).click();
		jest.advanceTimersByTime( 300 );

		expect( document.querySelector( '.hve-notification' ) ).toBeNull();

		jest.useRealTimers();
	} );

	test( 'some sozinha depois da duração informada', () => {
		jest.useFakeTimers();

		const notifications = mountNotifications();
		notifications.show( 'temporária', 'info', 1000 );

		expect( document.querySelector( '.hve-notification' ) ).not.toBeNull();

		jest.advanceTimersByTime( 1000 + 300 );

		expect( document.querySelector( '.hve-notification' ) ).toBeNull();

		jest.useRealTimers();
	} );

	test( 'não quebra quando usada sem montar', () => {
		const notifications = new Notifications( document.createElement( 'div' ) );

		expect( notifications.show( 'nada' ) ).toBeNull();
	} );
} );
