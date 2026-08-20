/**
 * Seletor do Widget HTML renderizado pelo Elementor.
 *
 * O Elementor imprime esse widget de duas formas, dependendo da versão e
 * das configurações do site:
 *
 *  - Clássica:
 *      .elementor-widget-html > .elementor-widget-container > (HTML do usuário)
 *  - DOM otimizado ("Optimized Markup" / element caching ligado):
 *      .elementor-widget-html > (HTML do usuário)   ← sem o wrapper interno
 *
 * Por isso o seletor mira o próprio widget, e {@link resolveWidgetRoot}
 * decide, para cada um, qual elemento realmente contém o HTML editável.
 * Antes de tratar os dois casos, o plugin dependia da
 * `.elementor-widget-container` sempre existir e não funcionava nos sites
 * com o DOM otimizado do Elementor.
 *
 * Compartilhado entre Editor e DomWatcher para nunca ficar duplicado.
 */
export const WIDGET_SELECTOR = '.elementor-widget-html';

/**
 * Devolve o elemento que guarda o HTML do usuário dentro de um Widget HTML,
 * funcionando tanto com a `.elementor-widget-container` clássica quanto sem
 * ela (quando o Elementor remove esse wrapper no DOM otimizado).
 *
 * @param {Element} widget Elemento `.elementor-widget-html`.
 * @return {Element} O container interno, ou o próprio widget se ele não existir.
 */
export function resolveWidgetRoot( widget ) {
	return widget.querySelector( ':scope > .elementor-widget-container' ) || widget;
}
