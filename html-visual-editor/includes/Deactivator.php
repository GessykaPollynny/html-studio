<?php
/**
 * Rotina de desativação do plugin.
 *
 * @package HTMLVisualEditor\Includes
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Includes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Limpa apenas o que é seguro remover na desativação (dados persistem).
 */
final class Deactivator {

	/**
	 * Executado no register_deactivation_hook.
	 */
	public static function deactivate(): void {
		flush_rewrite_rules();
	}
}
