<?php
/**
 * Avisos administrativos do plugin.
 *
 * @package HTMLVisualEditor\Admin
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Admin;

use HTMLVisualEditor\Includes\Elementor\HtmlWidgetDetector;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Exibe avisos no wp-admin (ex.: dependência do Elementor ausente).
 */
final class AdminNotices {

	/**
	 * Registra os hooks de admin.
	 */
	public function register(): void {
		add_action( 'admin_notices', array( $this, 'maybe_render_missing_elementor_notice' ) );
	}

	/**
	 * Alerta o administrador quando o Elementor não está ativo.
	 */
	public function maybe_render_missing_elementor_notice(): void {
		if ( HtmlWidgetDetector::is_elementor_active() ) {
			return;
		}

		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		printf(
			'<div class="notice notice-warning is-dismissible"><p>%s</p></div>',
			esc_html__( 'HTML Visual Editor requer o plugin Elementor ativo. Ative o Elementor para habilitar a edição visual dos Widgets HTML.', 'html-visual-editor' )
		);
	}
}
