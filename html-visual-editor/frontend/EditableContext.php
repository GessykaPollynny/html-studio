<?php
/**
 * Regra única de decisão: "esta requisição pode entrar em modo de edição?".
 *
 * @package HTMLVisualEditor\Frontend
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Frontend;

use HTMLVisualEditor\Includes\Elementor\HtmlWidgetDetector;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Centraliza a verificação de elegibilidade, usada tanto pelo
 * AssetManager (o que carregar) quanto pelo EditorBootstrap (o que renderizar).
 */
final class EditableContext {

	/**
	 * Indica se a requisição atual deve exibir o editor visual.
	 */
	public static function current_request_is_editable(): bool {
		if ( is_admin() || ! is_singular() || ! is_user_logged_in() ) {
			return false;
		}

		$post_id = get_queried_object_id();

		if ( $post_id <= 0 || ! current_user_can( 'edit_post', $post_id ) ) {
			return false;
		}

		return HtmlWidgetDetector::page_has_html_widget( $post_id );
	}
}
