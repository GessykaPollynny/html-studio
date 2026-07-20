<?php
/**
 * Detecta a presença do Widget HTML do Elementor em um conteúdo.
 *
 * @package HTMLVisualEditor\Includes\Elementor
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Includes\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Varre os dados do Elementor (_elementor_data) em busca do widget "html".
 *
 * O resultado é cacheado em post meta própria (_hve_has_html_widget) para
 * evitar decodificar o JSON do Elementor a cada requisição, e invalidado
 * automaticamente sempre que o post é salvo novamente.
 */
final class HtmlWidgetDetector {

	private const WIDGET_TYPE = 'html';
	private const CACHE_META_KEY = '_hve_has_html_widget';

	/**
	 * Cache em memória (válido apenas durante a requisição atual).
	 *
	 * @var array<int,bool>
	 */
	private static array $runtime_cache = array();

	/**
	 * Indica se o post contém ao menos um Widget HTML do Elementor.
	 *
	 * @param int $post_id ID do post a verificar.
	 */
	public static function page_has_html_widget( int $post_id ): bool {
		if ( $post_id <= 0 ) {
			return false;
		}

		if ( array_key_exists( $post_id, self::$runtime_cache ) ) {
			return self::$runtime_cache[ $post_id ];
		}

		$has_widget = self::resolve( $post_id );

		self::$runtime_cache[ $post_id ] = $has_widget;

		return $has_widget;
	}

	/**
	 * Indica se o Elementor está ativo e carregado.
	 */
	public static function is_elementor_active(): bool {
		return did_action( 'elementor/loaded' ) > 0;
	}

	/**
	 * Registra a invalidação automática do cache persistente.
	 */
	public static function register_cache_invalidation(): void {
		add_action( 'save_post', array( self::class, 'invalidate_cache' ), 20, 1 );
	}

	/**
	 * Remove o cache (memória + banco) de um post específico.
	 *
	 * @param int $post_id ID do post alterado.
	 */
	public static function invalidate_cache( int $post_id ): void {
		unset( self::$runtime_cache[ $post_id ] );
		delete_post_meta( $post_id, self::CACHE_META_KEY );
	}

	/**
	 * Resolve a presença do widget, usando o cache persistente quando possível.
	 *
	 * @param int $post_id ID do post a verificar.
	 */
	private static function resolve( int $post_id ): bool {
		if ( ! self::is_elementor_active() ) {
			return false;
		}

		if ( 'builder' !== get_post_meta( $post_id, '_elementor_edit_mode', true ) ) {
			return false;
		}

		$cached = get_post_meta( $post_id, self::CACHE_META_KEY, true );

		if ( '' !== $cached ) {
			return '1' === $cached;
		}

		$has_widget = self::scan_elementor_data( $post_id );

		update_post_meta( $post_id, self::CACHE_META_KEY, $has_widget ? '1' : '0' );

		return $has_widget;
	}

	/**
	 * Decodifica e varre recursivamente o JSON do Elementor.
	 *
	 * @param int $post_id ID do post a verificar.
	 */
	private static function scan_elementor_data( int $post_id ): bool {
		$raw_data = get_post_meta( $post_id, '_elementor_data', true );

		if ( empty( $raw_data ) ) {
			return false;
		}

		$elements = is_array( $raw_data ) ? $raw_data : json_decode( (string) $raw_data, true );

		if ( ! is_array( $elements ) ) {
			return false;
		}

		return self::contains_html_widget( $elements );
	}

	/**
	 * Percorre a árvore de elementos do Elementor em busca do widget HTML.
	 *
	 * @param array<int,mixed> $elements Lista de elementos/seções do Elementor.
	 */
	private static function contains_html_widget( array $elements ): bool {
		foreach ( $elements as $element ) {
			if ( ! is_array( $element ) ) {
				continue;
			}

			if ( isset( $element['widgetType'] ) && self::WIDGET_TYPE === $element['widgetType'] ) {
				return true;
			}

			if ( ! empty( $element['elements'] ) && is_array( $element['elements'] ) ) {
				if ( self::contains_html_widget( $element['elements'] ) ) {
					return true;
				}
			}
		}

		return false;
	}
}
