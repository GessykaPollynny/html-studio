<?php
/**
 * Plugin Name:       HTML Visual Editor
 * Plugin URI:        https://github.com/GessykaPollynny/html-studio
 * Description:       Editor visual para conteúdos inseridos no Widget HTML do Elementor. Edite textos, imagens, botões e estilos sem tocar em código.
 * Version:           1.1.2
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Gessyka Pollynny
 * Author URI:        https://github.com/GessykaPollynny
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       html-visual-editor
 * Domain Path:       /languages
 *
 * @package HTMLVisualEditor
 */

declare( strict_types = 1 );

namespace HTMLVisualEditor;

use HTMLVisualEditor\Includes\Activator;
use HTMLVisualEditor\Includes\Autoloader;
use HTMLVisualEditor\Includes\Deactivator;
use HTMLVisualEditor\Includes\Plugin;

// Impede o acesso direto ao arquivo.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Constantes globais do plugin.
// Alimenta o `?ver=` dos assets enfileirados. Subir esta constante a cada
// release é o que faz os navegadores rebaixarem CSS/JS já em cache — sem
// isso, uma atualização de arquivo não chega a quem já visitou a página.
define( 'HVE_VERSION', '1.1.2' );
define( 'HVE_PLUGIN_FILE', __FILE__ );
define( 'HVE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HVE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'HVE_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
define( 'HVE_MIN_PHP_VERSION', '8.0' );
define( 'HVE_MIN_WP_VERSION', '6.0' );

require_once HVE_PLUGIN_DIR . 'includes/Autoloader.php';
Autoloader::register();

register_activation_hook( __FILE__, array( Activator::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Deactivator::class, 'deactivate' ) );

Plugin::instance()->boot();
