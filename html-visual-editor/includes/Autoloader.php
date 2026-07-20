<?php
/**
 * Autoloader PSR-4 próprio do plugin.
 *
 * Evita qualquer dependência externa (Composer) mapeando prefixos de
 * namespace diretamente para as pastas físicas do plugin.
 *
 * @package HTMLVisualEditor\Includes
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Includes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Resolve classes do namespace HTMLVisualEditor para arquivos em disco.
 */
final class Autoloader {

	/**
	 * Mapa de prefixo de namespace => diretório relativo ao plugin.
	 *
	 * A ordem importa: prefixos mais específicos devem vir antes dos
	 * prefixos mais genéricos, pois a primeira correspondência vence.
	 *
	 * @var array<string,string>
	 */
	private const PREFIX_MAP = array(
		'HTMLVisualEditor\\Includes\\Elementor\\' => 'includes/Elementor/',
		'HTMLVisualEditor\\Includes\\'             => 'includes/',
		'HTMLVisualEditor\\Admin\\'                => 'admin/',
		'HTMLVisualEditor\\Frontend\\'             => 'frontend/',
	);

	/**
	 * Registra o autoloader no SPL.
	 */
	public static function register(): void {
		spl_autoload_register( array( self::class, 'autoload' ) );
	}

	/**
	 * Tenta carregar o arquivo correspondente a uma classe.
	 *
	 * @param string $class_name Nome totalmente qualificado da classe.
	 */
	public static function autoload( string $class_name ): void {
		foreach ( self::PREFIX_MAP as $prefix => $relative_dir ) {
			if ( 0 !== strpos( $class_name, $prefix ) ) {
				continue;
			}

			$relative_class = substr( $class_name, strlen( $prefix ) );
			$relative_path  = str_replace( '\\', DIRECTORY_SEPARATOR, $relative_class );
			$file           = HVE_PLUGIN_DIR . $relative_dir . $relative_path . '.php';

			if ( file_exists( $file ) ) {
				require_once $file;
			}

			return;
		}
	}
}
