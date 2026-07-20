/**
 * Comandos suportados pelo editor de texto próprio.
 * Todos mapeiam para comandos nativos do navegador (`document.execCommand`)
 * — nenhuma biblioteca de terceiros (sem TinyMCE, sem CKEditor).
 */
const COMMANDS = [
	{ id: 'bold', label: 'B', command: 'bold', title: 'Negrito' },
	{ id: 'italic', label: 'I', command: 'italic', title: 'Itálico' },
	{ id: 'underline', label: 'S', command: 'underline', title: 'Sublinhado' },
	{ id: 'ul', label: '• Lista', command: 'insertUnorderedList', title: 'Lista com marcadores' },
	{ id: 'ol', label: '1. Lista', command: 'insertOrderedList', title: 'Lista numerada' },
	{ id: 'link', label: 'Link', command: 'createLink', title: 'Inserir link' },
	{ id: 'unlink', label: 'Sem link', command: 'unlink', title: 'Remover link' },
	{ id: 'break', label: '↵', command: 'insertLineBreak', title: 'Quebra de linha' },
	{ id: 'clear', label: 'Limpar', command: 'removeFormat', title: 'Remover formatação' },
];

/**
 * RichTextToolbar — barra de formatação para um elemento contenteditable.
 *
 * A barra vive no painel lateral, fisicamente fora do elemento editado no
 * corpo da página. Para que os comandos ainda ajam sobre a seleção de
 * texto ativa no elemento, cada botão cancela o evento `mousedown`
 * (`preventDefault`), que é a forma padrão do próprio navegador de evitar
 * que o foco/seleção do contenteditable seja perdido ao clicar em outro
 * elemento da UI.
 */
export default class RichTextToolbar {
	constructor() {
		this.element = null;
		this.target = null;
	}

	/**
	 * @param {HTMLElement} container Onde a barra é inserida (dentro do painel).
	 * @param {HTMLElement} targetElement Elemento contenteditable a ser formatado.
	 */
	mount( container, targetElement ) {
		this.target = targetElement;
		this.element = document.createElement( 'div' );
		this.element.className = 'hve-rte-toolbar';

		COMMANDS.forEach( ( item ) => {
			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'hve-rte-toolbar__button';
			button.title = item.title;
			button.textContent = item.label;

			button.addEventListener( 'mousedown', ( event ) => event.preventDefault() );
			button.addEventListener( 'click', () => this.exec( item ) );

			this.element.appendChild( button );
		} );

		container.appendChild( this.element );
	}

	/**
	 * Executa o comando nativo do navegador sobre a seleção atual.
	 *
	 * @param {{command:string}} item
	 */
	exec( item ) {
		this.target.focus();

		if ( 'createLink' === item.command ) {
			const url = window.prompt( 'Endereço do link (https://...)', 'https://' );

			if ( ! url ) {
				return;
			}

			document.execCommand( item.command, false, url );
			return;
		}

		document.execCommand( item.command, false, null );
	}

	unmount() {
		this.element = null;
		this.target = null;
	}
}
