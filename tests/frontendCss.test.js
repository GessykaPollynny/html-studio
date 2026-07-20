/**
 * Este arquivo instancia o jsdom manualmente para parsear o CSS, o que
 * exige o ambiente Node (dentro do ambiente jsdom, carregar o próprio
 * jsdom quebra).
 *
 * @jest-environment node
 */

/**
 * Testes de invariantes da folha de estilos do editor.
 *
 * Estes testes existem por causa de dois bugs reais encontrados só no
 * teste ao vivo:
 *
 * 1. Os seletores da UI não eram ancorados em `#hve-root`, então as regras
 *    de `button` do tema venciam por especificidade e o botão destrutivo
 *    aparecia sem a cor de perigo.
 * 2. Ao ancorar, o plugin perdeu o `[hidden] { display: none }` que vinha
 *    por acidente do reset do tema — e o painel deixou de se esconder.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { JSDOM } = require( 'jsdom' );

const CAMINHO_CSS = path.join( __dirname, '..', 'html-visual-editor', 'assets', 'css', 'frontend.css' );

/**
 * Seletores que devem permanecer SEM âncora: eles miram o conteúdo da
 * página do site, que vive fora do container do editor. Ancorá-los
 * quebraria os outlines de seleção e o modo de edição.
 */
const SELETORES_FORA_DO_ROOT = [
	// Paleta de escopo global: o SelectionManager aplica os outlines de
	// seleção nos elementos da página, fora do container do editor.
	':root',
	'body.hve-editing',
	'body.hve-editing [data-hve-editable-root]',
	'body.hve-editing .hve-text-editing',
];

/**
 * Variáveis consumidas por elementos que vivem fora do `#hve-root`. Se
 * voltarem a ser declaradas só no container do editor, o `var()` fica
 * inválido nesses elementos e os outlines somem sem erro nenhum.
 */
const VARIAVEIS_DE_ESCOPO_GLOBAL = [
	'--hve-color-outline-hover',
	'--hve-color-outline-selected',
	'--hve-color-editable-hint',
];

/**
 * @return {CSSRule[]}
 */
function carregarRegras() {
	const css = fs.readFileSync( CAMINHO_CSS, 'utf8' );
	const dom = new JSDOM( `<!doctype html><html><head><style>${ css }</style></head><body></body></html>` );

	return Array.from( dom.window.document.styleSheets[ 0 ].cssRules );
}

describe( 'frontend.css — ancoragem em #hve-root', () => {
	test( 'a folha inteira parseia sem erro de sintaxe', () => {
		expect( carregarRegras().length ).toBeGreaterThan( 50 );
	} );

	test( 'todo seletor é ancorado, exceto os que miram a página do site', () => {
		const naoAncorados = carregarRegras()
			.filter( ( regra ) => regra.selectorText )
			.map( ( regra ) => regra.selectorText )
			.filter( ( seletor ) => ! seletor.includes( '#hve-root' ) );

		expect( naoAncorados.sort() ).toEqual( [ ...SELETORES_FORA_DO_ROOT ].sort() );
	} );

	test( 'as regras do modo de edição continuam mirando o body da página', () => {
		const seletores = carregarRegras()
			.filter( ( regra ) => regra.selectorText )
			.map( ( regra ) => regra.selectorText );

		SELETORES_FORA_DO_ROOT.forEach( ( esperado ) => {
			expect( seletores ).toContain( esperado );
		} );
	} );
} );

describe( 'frontend.css — variáveis usadas fora do #hve-root', () => {
	test( 'os outlines de seleção são declarados em :root, não só em #hve-root', () => {
		const regraRoot = carregarRegras().find( ( r ) => r.selectorText === ':root' );

		expect( regraRoot ).toBeDefined();

		VARIAVEIS_DE_ESCOPO_GLOBAL.forEach( ( variavel ) => {
			expect( regraRoot.style.getPropertyValue( variavel ).trim() ).not.toBe( '' );
		} );
	} );

	test( 'essas variáveis NÃO são declaradas apenas dentro de #hve-root', () => {
		// Regressão da 1.1.1: declaradas só em #hve-root, o var() era
		// inválido nos elementos da página e o outline nunca renderizava.
		const regraHveRoot = carregarRegras().find( ( r ) => r.selectorText === '#hve-root' );

		VARIAVEIS_DE_ESCOPO_GLOBAL.forEach( ( variavel ) => {
			expect( regraHveRoot.style.getPropertyValue( variavel ).trim() ).toBe( '' );
		} );
	} );
} );

describe( 'frontend.css — utilitário [hidden]', () => {
	test( 'existe uma regra que esconde elementos com o atributo hidden', () => {
		const regra = carregarRegras().find(
			( r ) => r.selectorText === '#hve-root [hidden]'
		);

		expect( regra ).toBeDefined();
		expect( regra.style.getPropertyValue( 'display' ) ).toBe( 'none' );
	} );

	test( 'a regra vence o display dos componentes (precisa ser !important)', () => {
		// Sem !important, `#hve-root .hve-panel { display: flex }` — de mesma
		// especificidade e declarada antes — continuaria valendo, e o painel
		// nunca se esconderia.
		const regra = carregarRegras().find(
			( r ) => r.selectorText === '#hve-root [hidden]'
		);

		expect( regra.style.getPropertyPriority( 'display' ) ).toBe( 'important' );
	} );
} );
