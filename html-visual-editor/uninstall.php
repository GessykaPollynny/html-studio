<?php
/**
 * Rotina de desinstalação — remove dados persistentes do plugin.
 *
 * @package HTMLVisualEditor
 */

declare( strict_types = 1 );

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'hve_settings' );

global $wpdb;

// Remove o cache de detecção do Widget HTML gravado em post meta.
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
		'_hve_has_html_widget'
	)
);
