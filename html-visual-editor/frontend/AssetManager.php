<?php
/**
 * Enfileiramento condicional dos assets do editor no frontend.
 *
 * @package HTMLVisualEditor\Frontend
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Frontend;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Carrega CSS/JS do editor apenas quando a página é elegível, evitando
 * peso desnecessário em páginas sem Widget HTML do Elementor.
 */
final class AssetManager {

	private const HANDLE_STYLE  = 'hve-frontend-style';
	private const HANDLE_SCRIPT = 'hve-frontend-script';

	/**
	 * Registra os hooks de enfileiramento.
	 */
	public function register(): void {
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue' ) );
		add_filter( 'script_loader_tag', array( $this, 'add_module_type' ), 10, 2 );
	}

	/**
	 * Marca a tag <script> do editor como `type="module"`.
	 *
	 * `wp_script_add_data( $handle, 'type', 'module' )` não é reconhecido
	 * pelo core para gerar esse atributo — o WP_Scripts::do_item() ignora
	 * a chave 'type'. O filtro script_loader_tag é a forma correta e
	 * compatível com WordPress 6.0+ de adicionar o atributo (a API
	 * dedicada wp_enqueue_script_module só existe a partir do WP 6.5).
	 *
	 * @param string $tag    Tag <script> original gerada pelo core.
	 * @param string $handle Handle do script sendo impresso.
	 */
	public function add_module_type( string $tag, string $handle ): string {
		if ( self::HANDLE_SCRIPT !== $handle ) {
			return $tag;
		}

		return str_replace( ' src=', ' type="module" src=', $tag );
	}

	/**
	 * Decide se os assets devem ser carregados na requisição atual.
	 */
	public function maybe_enqueue(): void {
		if ( ! EditableContext::current_request_is_editable() ) {
			return;
		}

		$this->enqueue_style();
		$this->enqueue_script();

		// Necessário para a aba Imagens (Fase 6) abrir a Biblioteca de
		// Mídia nativa do WordPress (wp.media) fora do wp-admin.
		wp_enqueue_media();
	}

	/**
	 * Enfileira a folha de estilos principal do editor.
	 */
	private function enqueue_style(): void {
		wp_enqueue_style(
			self::HANDLE_STYLE,
			HVE_PLUGIN_URL . 'assets/css/frontend.css',
			array(),
			HVE_VERSION
		);
	}

	/**
	 * Enfileira o script principal (ES6 module) e localiza os dados de runtime.
	 */
	private function enqueue_script(): void {
		wp_enqueue_script(
			self::HANDLE_SCRIPT,
			HVE_PLUGIN_URL . 'assets/js/main.js',
			array(),
			HVE_VERSION,
			true
		);

		wp_localize_script(
			self::HANDLE_SCRIPT,
			'hveData',
			array(
				'restUrl'   => esc_url_raw( rest_url( 'hve/v1' ) ),
				'restNonce' => wp_create_nonce( 'wp_rest' ),
				'postId'    => get_queried_object_id(),
				'i18n'      => array(
					'editHtml'     => __( 'Editar HTML', 'html-visual-editor' ),
					'exitEditMode' => __( 'Sair da edição', 'html-visual-editor' ),
					'save'         => __( 'Salvar', 'html-visual-editor' ),
					'saving'       => __( 'Salvando...', 'html-visual-editor' ),
					'saved'        => __( 'Alterações salvas com sucesso.', 'html-visual-editor' ),
					'saveError'    => __( 'Não foi possível salvar. Tente novamente.', 'html-visual-editor' ),
				),
			)
		);
	}
}
