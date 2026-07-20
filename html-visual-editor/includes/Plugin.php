<?php
/**
 * Orquestrador principal do plugin.
 *
 * @package HTMLVisualEditor\Includes
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Includes;

use HTMLVisualEditor\Admin\AdminNotices;
use HTMLVisualEditor\Frontend\AssetManager;
use HTMLVisualEditor\Frontend\EditorBootstrap;
use HTMLVisualEditor\Frontend\RestSaveController;
use HTMLVisualEditor\Includes\Elementor\HtmlWidgetDetector;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Singleton responsável por registrar todos os serviços do plugin.
 */
final class Plugin {

	/**
	 * Instância única do plugin.
	 *
	 * @var Plugin|null
	 */
	private static ?Plugin $instance = null;

	/**
	 * Evita inicialização duplicada de hooks.
	 *
	 * @var bool
	 */
	private bool $booted = false;

	/**
	 * Retorna (e cria, se necessário) a instância única do plugin.
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Construtor privado — uso exclusivo via instance().
	 */
	private function __construct() {}

	/**
	 * Inicializa os hooks do WordPress.
	 */
	public function boot(): void {
		if ( $this->booted ) {
			return;
		}

		$this->booted = true;

		add_action( 'init', array( $this, 'load_textdomain' ) );
		add_action( 'plugins_loaded', array( $this, 'register_services' ) );
	}

	/**
	 * Carrega o domínio de tradução do plugin.
	 */
	public function load_textdomain(): void {
		load_plugin_textdomain(
			'html-visual-editor',
			false,
			dirname( HVE_PLUGIN_BASENAME ) . '/languages'
		);
	}

	/**
	 * Registra os serviços de cada camada (admin/frontend/núcleo).
	 */
	public function register_services(): void {
		HtmlWidgetDetector::register_cache_invalidation();

		( new AdminNotices() )->register();
		( new AssetManager() )->register();
		( new EditorBootstrap() )->register();
		( new RestSaveController() )->register();
	}
}
