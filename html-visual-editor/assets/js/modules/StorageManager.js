import StyleManager from './StyleManager.js?ver=1.1.7';

/**
 * StorageManager — envia o HTML editado de volta ao servidor.
 *
 * Nunca persiste apenas no navegador: cada chamada a {@link save} faz um
 * POST autenticado (nonce REST) para o endpoint do plugin, que localiza
 * o Widget HTML correspondente em `_elementor_data` e grava via
 * `update_post_meta` (ver RestSaveController, no PHP).
 *
 * Antes de enviar, cada widget é clonado e "limpo": atributos que só
 * fazem sentido durante a sessão de edição (`contenteditable`,
 * `data-hve-editable-root`, classe `hve-text-editing`) são removidos, e
 * as regras de estilo do StyleManager relevantes àquele widget são
 * embutidas como um `<style data-hve-managed="true">` no início do HTML
 * — assim o resultado salvo é autocontido e sobrevive a um carregamento
 * de página sem o JS do editor.
 */
export default class StorageManager {
	/**
	 * @param {Object} config Dados localizados (window.hveData).
	 * @param {() => Element[]} getRoots Função que retorna os containers editáveis atuais.
	 */
	constructor( config, getRoots ) {
		this.config = config;
		this.getRoots = getRoots;
	}

	/**
	 * Envia o estado atual de todos os Widgets HTML editáveis para o servidor.
	 *
	 * @return {Promise<Object>}
	 */
	async save() {
		const widgets = this.getRoots().map( ( root, index ) => ( {
			index,
			elementId: this.resolveElementId( root ),
			html: this.buildSavableHtml( root ),
		} ) );

		const response = await fetch( `${ this.config.restUrl }/save`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': this.config.restNonce,
			},
			body: JSON.stringify( {
				postId: this.config.postId,
				widgets,
			} ),
		} );

		if ( ! response.ok ) {
			const body = await response.json().catch( () => ( {} ) );
			throw new Error( body.message || 'hve_save_failed' );
		}

		return response.json();
	}

	/**
	 * Descobre o ID único que o Elementor atribui ao Widget HTML que
	 * contém este container. Esse ID vem do atributo `data-id` do wrapper
	 * `.elementor-element` renderizado pelo Elementor e é exatamente a
	 * mesma chave `"id"` gravada dentro de `_elementor_data`. Enviá-lo ao
	 * backend permite casar cada widget pelo seu identificador estável, em
	 * vez de depender da ordem em que os widgets aparecem no DOM — o que
	 * elimina o risco de o conteúdo de um widget ser gravado em outro
	 * quando há vários Widgets HTML na mesma página.
	 *
	 * @param {Element} root
	 * @return {string} ID do elemento Elementor, ou '' se não encontrado.
	 */
	resolveElementId( root ) {
		const widget = root.closest( '.elementor-element[data-id]' );

		return widget ? widget.getAttribute( 'data-id' ) : '';
	}

	/**
	 * @param {Element} root
	 * @return {string}
	 */
	buildSavableHtml( root ) {
		const clone = root.cloneNode( true );

		this.stripEditingArtifacts( clone );

		// Remove os blocos de estilo gerenciados por salvamentos anteriores.
		// Sem isso, cada save prepende um novo `<style data-hve-managed>` sem
		// tirar o antigo, e eles se acumulam indefinidamente no HTML salvo.
		clone.querySelectorAll( 'style[data-hve-managed]' ).forEach( ( styleEl ) => styleEl.remove() );

		const styleIds = this.collectStyleIds( root );
		const css = StyleManager.renderForIds( styleIds );
		const styleTag = css ? `<style data-hve-managed="true">${ css }</style>` : '';

		return styleTag + clone.innerHTML;
	}

	/**
	 * Remove do clone tudo que existe apenas para a sessão de edição atual:
	 * marcadores de container editável, contenteditable, a classe de texto
	 * em edição e o outline temporário de hover/seleção do SelectionManager
	 * (a única forma de garantir que ele nunca vaze para o HTML salvo é
	 * limpá-lo explicitamente, já que o elemento pode estar selecionado
	 * no exato momento em que o usuário clica em Salvar).
	 *
	 * @param {Element} clone
	 */
	stripEditingArtifacts( clone ) {
		[ clone, ...clone.querySelectorAll( '*' ) ].forEach( ( el ) => {
			el.removeAttribute( 'data-hve-editable-root' );
			el.removeAttribute( 'contenteditable' );
			el.classList.remove( 'hve-text-editing' );
			el.style.removeProperty( 'outline' );
			el.style.removeProperty( 'outline-offset' );

			if ( 0 === el.classList.length ) {
				el.removeAttribute( 'class' );
			}

			if ( '' === el.getAttribute( 'style' ) ) {
				el.removeAttribute( 'style' );
			}
		} );
	}

	/**
	 * @param {Element} root
	 * @return {Set<string>}
	 */
	collectStyleIds( root ) {
		const ids = new Set();

		if ( root.hasAttribute( 'data-hve-style-id' ) ) {
			ids.add( root.getAttribute( 'data-hve-style-id' ) );
		}

		root.querySelectorAll( '[data-hve-style-id]' ).forEach( ( el ) => {
			ids.add( el.getAttribute( 'data-hve-style-id' ) );
		} );

		return ids;
	}
}
