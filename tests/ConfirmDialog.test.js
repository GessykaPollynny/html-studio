/**
 * Testes do modal de confirmação e da proteção da ação destrutiva.
 *
 * A garantia mais importante aqui é negativa: quando o usuário NÃO
 * confirma, o elemento precisa continuar no DOM.
 */

import ConfirmDialog from '../html-visual-editor/assets/js/modules/ConfirmDialog.js';
import LayoutTab from '../html-visual-editor/assets/js/modules/tabs/LayoutTab.js';

/**
 * @return {{root: HTMLElement, dialog: ConfirmDialog}}
 */
function mountDialog() {
	const root = document.createElement( 'div' );
	document.body.appendChild( root );

	const dialog = new ConfirmDialog( root );
	dialog.mount();

	return { root, dialog };
}

afterEach( () => {
	document.body.innerHTML = '';
} );

describe( 'ConfirmDialog', () => {
	test( 'nasce oculto e só aparece ao perguntar', () => {
		const { dialog } = mountDialog();

		expect( dialog.element.hidden ).toBe( true );

		dialog.ask( { message: 'Tem certeza?' } );

		expect( dialog.element.hidden ).toBe( false );
	} );

	test( 'confirmar resolve true', async () => {
		const { dialog } = mountDialog();
		const answer = dialog.ask( { confirmLabel: 'Excluir' } );

		document.querySelector( '.hve-confirm__button--confirm' ).click();

		await expect( answer ).resolves.toBe( true );
		expect( dialog.element.hidden ).toBe( true );
	} );

	test( 'cancelar resolve false', async () => {
		const { dialog } = mountDialog();
		const answer = dialog.ask( {} );

		document.querySelector( '.hve-confirm__button--cancel' ).click();

		await expect( answer ).resolves.toBe( false );
	} );

	test( 'tecla Esc resolve false', async () => {
		const { dialog } = mountDialog();
		const answer = dialog.ask( {} );

		document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape' } ) );

		await expect( answer ).resolves.toBe( false );
	} );

	test( 'clique no fundo resolve false', async () => {
		const { dialog } = mountDialog();
		const answer = dialog.ask( {} );

		dialog.element.click();

		await expect( answer ).resolves.toBe( false );
	} );

	test( 'usa textContent — não interpreta HTML na mensagem', () => {
		const { dialog } = mountDialog();

		dialog.ask( { message: '<img src=x onerror=alert(1)>' } );

		expect( dialog.messageElement.querySelector( 'img' ) ).toBeNull();
		expect( dialog.messageElement.textContent ).toBe( '<img src=x onerror=alert(1)>' );
	} );

	test( 'sem montar, recusa por segurança (nunca confirma sozinho)', async () => {
		const dialog = new ConfirmDialog( document.createElement( 'div' ) );

		await expect( dialog.ask( {} ) ).resolves.toBe( false );
	} );
} );

describe( 'LayoutTab.remove — exclusão protegida', () => {
	/**
	 * @param {boolean} confirmed
	 * @return {{tab: LayoutTab, context: Object, alvo: Element}}
	 */
	function setup( confirmed ) {
		document.body.innerHTML = `<div class="root"><p id="alvo">conteúdo</p></div>`;

		const context = {
			element: document.getElementById( 'alvo' ),
			root: document.querySelector( '.root' ),
			confirm: jest.fn().mockResolvedValue( confirmed ),
			notifyChange: jest.fn(),
			deselect: jest.fn(),
			reselect: jest.fn(),
		};

		const tab = new LayoutTab();
		tab.mount( document.createElement( 'div' ), context );

		return { tab, context, alvo: context.element };
	}

	test( 'NÃO exclui quando o usuário cancela', async () => {
		const { tab, context } = setup( false );

		await tab.remove();

		expect( context.confirm ).toHaveBeenCalled();
		expect( document.getElementById( 'alvo' ) ).not.toBeNull();
		expect( context.notifyChange ).not.toHaveBeenCalled();
		expect( context.deselect ).not.toHaveBeenCalled();
	} );

	test( 'exclui quando o usuário confirma', async () => {
		const { tab, context } = setup( true );

		await tab.remove();

		expect( document.getElementById( 'alvo' ) ).toBeNull();
		expect( context.notifyChange ).toHaveBeenCalled();
		expect( context.deselect ).toHaveBeenCalled();
	} );

	test( 'pede confirmação marcando a ação como destrutiva', async () => {
		const { tab, context } = setup( false );

		await tab.remove();

		expect( context.confirm ).toHaveBeenCalledWith(
			expect.objectContaining( { danger: true } )
		);
	} );
} );
