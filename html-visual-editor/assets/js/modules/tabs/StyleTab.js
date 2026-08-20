import FieldBuilder from '../FieldBuilder.js?ver=1.1.7';
import StyleManager from '../StyleManager.js?ver=1.1.7';
import ResponsiveState from '../ResponsiveState.js?ver=1.1.7';
import { FONT_LIBRARY } from '../Fonts.js?ver=1.1.7';

const FONT_WEIGHT_OPTIONS = [
	{ value: '', label: 'Padrão' },
	{ value: '300', label: 'Leve (300)' },
	{ value: '400', label: 'Normal (400)' },
	{ value: '500', label: 'Médio (500)' },
	{ value: '600', label: 'Semi-negrito (600)' },
	{ value: '700', label: 'Negrito (700)' },
	{ value: '800', label: 'Extra-negrito (800)' },
];

const TEXT_ALIGN_OPTIONS = [
	{ value: '', label: 'Padrão' },
	{ value: 'left', label: 'Esquerda' },
	{ value: 'center', label: 'Centro' },
	{ value: 'right', label: 'Direita' },
	{ value: 'justify', label: 'Justificado' },
];

const DISPLAY_OPTIONS = [
	{ value: '', label: 'Padrão' },
	{ value: 'block', label: 'Block' },
	{ value: 'inline', label: 'Inline' },
	{ value: 'inline-block', label: 'Inline-block' },
	{ value: 'flex', label: 'Flex' },
	{ value: 'grid', label: 'Grid' },
	{ value: 'none', label: 'None (ocultar)' },
];

/**
 * Definição declarativa de todos os campos de estilo, agrupados por seção.
 * Nenhum grupo conhece o outro; StyleTab apenas itera esta lista.
 */
const GROUPS = [
	{
		title: 'Cor & Fundo',
		fields: [
			{ prop: 'color', label: 'Cor do texto', type: 'color' },
			{ prop: 'background-color', label: 'Cor de fundo', type: 'color' },
		],
	},
	{
		title: 'Bordas & Sombra',
		fields: [
			{ prop: 'border', label: 'Borda (ex: 1px solid #000000)' },
			{ prop: 'border-radius', label: 'Border radius (ex: 8px)' },
			{ prop: 'box-shadow', label: 'Shadow (ex: 0 2px 8px rgba(0,0,0,.2))' },
		],
	},
	{
		title: 'Espaçamento',
		fields: [
			{ prop: 'padding', label: 'Padding (ex: 16px 24px)' },
			{ prop: 'margin', label: 'Margin (ex: 0 auto)' },
			{ prop: 'gap', label: 'Gap (ex: 12px)' },
		],
	},
	{
		title: 'Tipografia',
		fields: [
			{ prop: 'font-family', label: 'Fonte', type: 'font' },
			{ prop: 'font-weight', label: 'Peso', type: 'select', options: FONT_WEIGHT_OPTIONS },
			{ prop: 'font-size', label: 'Tamanho (ex: 16px)' },
			{ prop: 'line-height', label: 'Line height (ex: 1.5)' },
			{ prop: 'letter-spacing', label: 'Letter spacing (ex: 0.02em)' },
			{ prop: 'text-align', label: 'Text align', type: 'select', options: TEXT_ALIGN_OPTIONS },
		],
	},
	{
		title: 'Layout & Dimensões',
		fields: [
			{ prop: 'display', label: 'Display', type: 'select', options: DISPLAY_OPTIONS },
			{ prop: 'width', label: 'Width (ex: 100% ou 320px)' },
			{ prop: 'height', label: 'Height' },
			{ prop: 'max-width', label: 'Max width' },
			{ prop: 'min-width', label: 'Min width' },
		],
	},
	{
		title: 'Efeitos',
		fields: [
			{ prop: 'opacity', label: 'Opacidade (0 a 1)' },
			{ prop: 'background-image', label: 'Gradiente (ex: linear-gradient(90deg, #f00, #00f))' },
		],
	},
];

const BREAKPOINT_LABELS = {
	desktop: 'Desktop',
	tablet: 'Tablet',
	mobile: 'Mobile',
};

/**
 * Propriedades que esperam um comprimento e, portanto, precisam de unidade.
 * `line-height` e `opacity` ficam de fora de propósito: aceitam número puro
 * (1.5, 0.8) e não devem ganhar `px`.
 */
const LENGTH_PROPS = new Set( [
	'border-radius', 'padding', 'margin', 'gap',
	'font-size', 'letter-spacing',
	'width', 'height', 'max-width', 'min-width',
] );

/**
 * Completa com `px` quando o usuário digita apenas um número num campo de
 * comprimento (ex.: "45" → "45px"). Sem isso o valor vira CSS inválido
 * (`font-size: 45`) e o navegador o ignora — foi o que fazia as mudanças de
 * tamanho "não alterarem nada". Valores com espaço (ex.: "16px 24px") ou
 * que já trazem unidade/palavra-chave passam intactos.
 *
 * @param {string} prop
 * @param {string} value
 * @return {string}
 */
export function withUnit( prop, value ) {
	const trimmed = ( value || '' ).trim();

	if ( LENGTH_PROPS.has( prop ) && /^\d+(\.\d+)?$/.test( trimmed ) ) {
		return `${ trimmed }px`;
	}

	return trimmed;
}

/**
 * StyleTab — aplica estilos ao elemento selecionado através do
 * StyleManager, sempre no breakpoint atualmente ativo em ResponsiveState.
 *
 * Reage a trocas de breakpoint enquanto está montada, re-renderizando os
 * campos com os valores já salvos para o novo breakpoint.
 */
export default class StyleTab {
	constructor() {
		this.container = null;
		this.context = null;
		this.unsubscribe = null;
	}

	/**
	 * @param {HTMLElement} container
	 * @param {Object} context
	 */
	mount( container, context ) {
		this.container = container;
		this.context = context;

		this.renderFields();

		this.unsubscribe = ResponsiveState.subscribe( () => this.renderFields() );
	}

	unmount() {
		if ( this.unsubscribe ) {
			this.unsubscribe();
			this.unsubscribe = null;
		}

		this.container = null;
		this.context = null;
	}

	/**
	 * Reconstrói todos os campos para o breakpoint atual.
	 */
	renderFields() {
		if ( ! this.container ) {
			return;
		}

		this.container.innerHTML = '';

		const breakpoint = ResponsiveState.get();

		const note = document.createElement( 'p' );
		note.className = 'hve-style-tab__breakpoint-note';
		note.textContent = `Editando estilos para: ${ BREAKPOINT_LABELS[ breakpoint ] }`;
		this.container.appendChild( note );

		GROUPS.forEach( ( group, index ) => {
			this.container.appendChild( this.buildGroup( group, breakpoint, 0 === index ) );
		} );
	}

	/**
	 * @param {{title:string,fields:Array}} group
	 * @param {string} breakpoint
	 * @param {boolean} openByDefault
	 * @return {HTMLElement}
	 */
	buildGroup( group, breakpoint, openByDefault ) {
		const details = document.createElement( 'details' );
		details.className = 'hve-style-tab__group';
		details.open = openByDefault;

		const summary = document.createElement( 'summary' );
		summary.textContent = group.title;
		details.appendChild( summary );

		group.fields.forEach( ( field ) => {
			details.appendChild( this.buildField( field, breakpoint ) );
		} );

		return details;
	}

	/**
	 * @param {{prop:string,label:string,type?:string,options?:Array}} field
	 * @param {string} breakpoint
	 * @return {HTMLElement}
	 */
	buildField( field, breakpoint ) {
		const currentValue = this.resolveCurrentValue( field.prop, breakpoint );

		const onChange = ( value ) => {
			StyleManager.setProperty( this.context.element, field.prop, withUnit( field.prop, value ), breakpoint );
			this.context.notifyChange();
		};

		if ( 'select' === field.type ) {
			return FieldBuilder.select( field.label, field.options, currentValue, onChange );
		}

		if ( 'font' === field.type ) {
			return FieldBuilder.fontSelect( field.label, FONT_LIBRARY, currentValue, onChange );
		}

		if ( 'color' === field.type ) {
			return FieldBuilder.colorInput( field.label, currentValue, onChange );
		}

		return FieldBuilder.textInput( field.label, currentValue, onChange );
	}

	/**
	 * Prioriza a regra já gravada pelo StyleManager para o breakpoint
	 * atual; no desktop, cai para o estilo inline já existente no
	 * elemento (útil ao editar HTML gerado por IA que já traz estilos).
	 *
	 * @param {string} property
	 * @param {string} breakpoint
	 * @return {string}
	 */
	resolveCurrentValue( property, breakpoint ) {
		const managed = StyleManager.getProperty( this.context.element, property, breakpoint );

		if ( managed ) {
			return managed;
		}

		if ( 'desktop' === breakpoint ) {
			return this.context.element.style.getPropertyValue( property ) || '';
		}

		return '';
	}
}
