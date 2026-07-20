/**
 * Lista única das tags HTML suportadas pelo editor visual.
 * Compartilhada por DOMInspector, SelectionManager e demais módulos —
 * nunca duplicada.
 */
export const SUPPORTED_TAGS = new Set( [
	'div', 'section', 'article', 'header', 'footer', 'nav', 'main',
	'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'button', 'a', 'img', 'svg', 'video', 'iframe',
	'ul', 'ol', 'li', 'table', 'input', 'textarea', 'select', 'label', 'canvas',
] );
