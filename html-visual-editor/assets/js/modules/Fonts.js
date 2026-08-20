/**
 * Biblioteca de fontes oferecida pela aba Estilo.
 *
 * Cada item traz:
 *  - value:  o valor aplicado em `font-family` (com fallback de família).
 *  - label:  o nome exibido no seletor.
 *  - google: (opcional) o parâmetro `family` da API do Google Fonts. Quando
 *            presente, o StyleManager carrega a fonte — na edição, via um
 *            `<link>`; no HTML salvo, via um `@import` embutido — para que ela
 *            apareça de verdade, inclusive para os visitantes do site.
 */
export const FONT_LIBRARY = [
	{ value: '', label: 'Padrão (herdar do site)' },

	// Fontes do sistema (sempre disponíveis, sem carregamento).
	{ value: 'Arial, sans-serif', label: 'Arial' },
	{ value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
	{ value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
	{ value: 'Tahoma, sans-serif', label: 'Tahoma' },
	{ value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
	{ value: 'Georgia, serif', label: 'Georgia' },
	{ value: '"Times New Roman", serif', label: 'Times New Roman' },
	{ value: '"Courier New", monospace', label: 'Courier New' },

	// Google Fonts populares.
	{ value: 'Jost, sans-serif', label: 'Jost', google: 'Jost:wght@300;400;500;600;700' },
	{ value: 'Poppins, sans-serif', label: 'Poppins', google: 'Poppins:wght@300;400;500;600;700' },
	{ value: 'Montserrat, sans-serif', label: 'Montserrat', google: 'Montserrat:wght@300;400;500;600;700' },
	{ value: 'Roboto, sans-serif', label: 'Roboto', google: 'Roboto:wght@300;400;500;700' },
	{ value: '"Open Sans", sans-serif', label: 'Open Sans', google: 'Open+Sans:wght@300;400;500;600;700' },
	{ value: 'Lato, sans-serif', label: 'Lato', google: 'Lato:wght@300;400;700' },
	{ value: 'Inter, sans-serif', label: 'Inter', google: 'Inter:wght@300;400;500;600;700' },
	{ value: 'Raleway, sans-serif', label: 'Raleway', google: 'Raleway:wght@300;400;500;600;700' },
	{ value: 'Nunito, sans-serif', label: 'Nunito', google: 'Nunito:wght@300;400;600;700' },
	{ value: 'Oswald, sans-serif', label: 'Oswald', google: 'Oswald:wght@300;400;500;600;700' },
	{ value: 'Work Sans, sans-serif', label: 'Work Sans', google: 'Work+Sans:wght@300;400;500;600;700' },
	{ value: '"Playfair Display", serif', label: 'Playfair Display', google: 'Playfair+Display:wght@400;500;600;700' },
	{ value: 'Merriweather, serif', label: 'Merriweather', google: 'Merriweather:wght@300;400;700' },
];

/**
 * Devolve o parâmetro `family` do Google Fonts para um valor de
 * `font-family`, ou `null` se for uma fonte do sistema (ou desconhecida).
 *
 * @param {string} fontFamilyValue
 * @return {string|null}
 */
export function googleFontParam( fontFamilyValue ) {
	const entry = FONT_LIBRARY.find( ( font ) => font.value === fontFamilyValue );

	return entry && entry.google ? entry.google : null;
}
