<?php
/**
 * Renderiza o container raiz onde a UI do editor é montada via JS.
 *
 * @package HTMLVisualEditor\Frontend
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Frontend;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * O botão flutuante, o painel lateral e a toolbar (Fases 2+) são montados
 * dentro deste container pelo JavaScript, mantendo o HTML original da
 * página intocado até que o editor seja efetivamente ativado.
 */
final class EditorBootstrap {

	/**
	 * Registra os hooks de renderização.
	 */
	public function register(): void {
		add_action( 'wp_footer', array( $this, 'render_root_container' ), 99 );
	}

	/**
	 * Imprime o container raiz do editor no rodapé da página.
	 */
	public function render_root_container(): void {
		if ( ! EditableContext::current_request_is_editable() ) {
			return;
		}

		echo '<div id="hve-root" data-hve-mounted="false"></div>';
	}
}
