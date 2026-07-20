<?php
/**
 * Endpoint REST que persiste as edições no Widget HTML do Elementor.
 *
 * @package HTMLVisualEditor\Frontend
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor\Frontend;

use HTMLVisualEditor\Includes\Elementor\HtmlWidgetDetector;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra `POST /wp-json/hve/v1/save`, que localiza os Widgets HTML de
 * um post em `_elementor_data` (casando cada um pelo `id` estável do
 * Elementor, com a ordem de percurso apenas como fallback) e grava o HTML
 * editado usando exclusivamente APIs nativas do WordPress — nunca apenas
 * no navegador.
 */
final class RestSaveController {

	private const NAMESPACE   = 'hve/v1';
	private const ROUTE       = '/save';
	private const WIDGET_TYPE = 'html';

	/**
	 * Registra o hook de inicialização das rotas REST.
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Declara a rota de salvamento.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			self::ROUTE,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_save' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'postId'  => array(
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
					'widgets' => array(
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Garante que o usuário autenticado pode editar o post informado.
	 * O nonce (`X-WP-Nonce`) já é validado automaticamente pelo core do
	 * WordPress antes deste callback ser executado.
	 *
	 * @param WP_REST_Request $request Requisição REST atual.
	 * @return true|WP_Error
	 */
	public function check_permission( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'postId' );

		if ( $post_id <= 0 || ! get_post( $post_id ) ) {
			return new WP_Error(
				'hve_invalid_post',
				__( 'Post inválido.', 'html-visual-editor' ),
				array( 'status' => 400 )
			);
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error(
				'hve_forbidden',
				__( 'Você não tem permissão para editar este conteúdo.', 'html-visual-editor' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Localiza os Widgets HTML do post e atualiza o conteúdo de cada um.
	 *
	 * @param WP_REST_Request $request Requisição REST atual.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_save( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'postId' );
		$widgets = (array) $request->get_param( 'widgets' );

		$raw_data = get_post_meta( $post_id, '_elementor_data', true );
		$elements = is_array( $raw_data ) ? $raw_data : json_decode( (string) $raw_data, true );

		if ( ! is_array( $elements ) ) {
			return new WP_Error(
				'hve_no_data',
				__( 'Este conteúdo não possui dados do Elementor.', 'html-visual-editor' ),
				array( 'status' => 404 )
			);
		}

		$incoming_by_id    = array();
		$incoming_by_index = array();

		foreach ( $widgets as $widget ) {
			if ( ! isset( $widget['html'] ) ) {
				continue;
			}

			$html = (string) $widget['html'];

			if ( isset( $widget['elementId'] ) && '' !== (string) $widget['elementId'] ) {
				$incoming_by_id[ (string) $widget['elementId'] ] = $html;
			}

			if ( isset( $widget['index'] ) ) {
				$incoming_by_index[ (int) $widget['index'] ] = $html;
			}
		}

		$cursor  = 0;
		$updated = $this->apply_to_elements( $elements, $incoming_by_id, $incoming_by_index, $cursor );

		update_post_meta( $post_id, '_elementor_data', wp_slash( (string) wp_json_encode( $updated ) ) );

		HtmlWidgetDetector::invalidate_cache( $post_id );
		$this->maybe_clear_elementor_cache();

		return new WP_REST_Response( array( 'success' => true ), 200 );
	}

	/**
	 * Percorre recursivamente a árvore de elementos do Elementor,
	 * substituindo o HTML de cada Widget HTML encontrado pelo conteúdo
	 * recebido do editor.
	 *
	 * A correspondência é feita, sempre que possível, pelo `id` estável que
	 * o Elementor atribui a cada elemento — o mesmo `data-id` que o frontend
	 * lê do DOM. Só quando o widget recebido não trouxe um id conhecido é que
	 * se recorre à ordem de percurso (`$cursor`), preservada apenas como
	 * fallback de compatibilidade. Isso impede que, havendo vários Widgets
	 * HTML na página, o conteúdo de um seja gravado sobre o de outro caso a
	 * ordem do DOM divirja da ordem em `_elementor_data`.
	 *
	 * @param array<int,mixed>  $elements Elementos/seções do Elementor.
	 * @param array<string,string> $incoming_by_id HTML recebido, indexado pelo id do elemento Elementor.
	 * @param array<int,string> $incoming_by_index HTML recebido, indexado pela ordem de renderização (fallback).
	 * @param int               $cursor Contador de widgets HTML já visitados (passado por referência).
	 * @return array<int,mixed>
	 */
	private function apply_to_elements( array $elements, array $incoming_by_id, array $incoming_by_index, int &$cursor ): array {
		foreach ( $elements as &$element ) {
			if ( ! is_array( $element ) ) {
				continue;
			}

			if ( isset( $element['widgetType'] ) && self::WIDGET_TYPE === $element['widgetType'] ) {
				$element_id = isset( $element['id'] ) ? (string) $element['id'] : '';

				if ( '' !== $element_id && array_key_exists( $element_id, $incoming_by_id ) ) {
					$element['settings']['html'] = $this->sanitize_html( $incoming_by_id[ $element_id ] );
				} elseif ( array_key_exists( $cursor, $incoming_by_index ) ) {
					$element['settings']['html'] = $this->sanitize_html( $incoming_by_index[ $cursor ] );
				}

				++$cursor;
			}

			if ( ! empty( $element['elements'] ) && is_array( $element['elements'] ) ) {
				$element['elements'] = $this->apply_to_elements( $element['elements'], $incoming_by_id, $incoming_by_index, $cursor );
			}
		}

		return $elements;
	}

	/**
	 * Sanitiza o HTML recebido conforme a capacidade do usuário atual —
	 * o mesmo padrão de confiança já aplicado pelo próprio Widget HTML
	 * do Elementor.
	 *
	 * @param string $html HTML bruto recebido do editor.
	 * @return string
	 */
	private function sanitize_html( string $html ): string {
		if ( current_user_can( 'unfiltered_html' ) ) {
			return $html;
		}

		return wp_kses_post( $html );
	}

	/**
	 * Limpa o cache de arquivos do Elementor, se o plugin estiver ativo,
	 * para que a próxima visualização reflita o HTML recém-salvo.
	 */
	private function maybe_clear_elementor_cache(): void {
		if ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->files_manager ) ) {
			\Elementor\Plugin::$instance->files_manager->clear_cache();
		}
	}
}
