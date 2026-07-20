<?php
/**
 * Rotina de ativação do plugin.
 *
 * @package HTMLVisualEditor\Includes
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Includes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Valida requisitos e prepara opções padrão na ativação.
 */
final class Activator {

	/**
	 * Executado no register_activation_hook.
	 */
	public static function activate(): void {
		self::check_requirements();

		if ( false === get_option( 'hve_settings' ) ) {
			add_option( 'hve_settings', self::default_settings() );
		}

		flush_rewrite_rules();
	}

	/**
	 * Impede a ativação em ambientes que não atendem aos requisitos mínimos.
	 */
	private static function check_requirements(): void {
		if ( version_compare( PHP_VERSION, HVE_MIN_PHP_VERSION, '<' ) ) {
			deactivate_plugins( HVE_PLUGIN_BASENAME );

			wp_die(
				esc_html__( 'HTML Visual Editor requer PHP 8.0 ou superior. Atualize o PHP do servidor para ativar o plugin.', 'html-visual-editor' ),
				esc_html__( 'Erro de ativação', 'html-visual-editor' ),
				array( 'back_link' => true )
			);
		}

		global $wp_version;

		if ( version_compare( $wp_version, HVE_MIN_WP_VERSION, '<' ) ) {
			deactivate_plugins( HVE_PLUGIN_BASENAME );

			wp_die(
				esc_html__( 'HTML Visual Editor requer WordPress 6.0 ou superior.', 'html-visual-editor' ),
				esc_html__( 'Erro de ativação', 'html-visual-editor' ),
				array( 'back_link' => true )
			);
		}
	}

	/**
	 * Opções padrão criadas na primeira ativação.
	 *
	 * @return array<string,mixed>
	 */
	private static function default_settings(): array {
		return array(
			'version'    => HVE_VERSION,
			'capability' => 'edit_posts',
		);
	}
}
