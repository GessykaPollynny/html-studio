/**
 * Ícones (SVG de linha) usados na UI do editor — abas do painel e toolbar.
 *
 * Cada ícone herda a cor do texto (`stroke: currentColor`) e o tamanho via
 * a classe `.hve-icon` no CSS, então acompanha automaticamente o estado
 * ativo/inativo dos elementos.
 */
export const ICONS = {
	// Lápis — Conteúdo / Editar.
	content: '<svg class="hve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',

	// Imagem.
	images: '<svg class="hve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m21 15-5-5L5 21"/></svg>',

	// Gota — Estilo / cor.
	style: '<svg class="hve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-4.5 5-7 8-7 11a7 7 0 0 0 14 0c0-3-2.5-6-7-11Z"/></svg>',

	// Layout.
	layout: '<svg class="hve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',

	// Celular — Responsivo.
	responsive: '<svg class="hve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>',
};
