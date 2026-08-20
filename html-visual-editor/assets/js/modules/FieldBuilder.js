/**
 * FieldBuilder — fábrica de campos de formulário reutilizados pelas abas
 * do painel (Conteúdo, Imagens, Estilo). Cada método devolve o elemento
 * wrapper com uma referência direta ao input em `.input`, evitando
 * `querySelector` repetido em quem consome.
 */
export default class FieldBuilder {
	/**
	 * @param {string} title
	 * @return {HTMLElement}
	 */
	static section( title ) {
		const section = document.createElement( 'div' );
		section.className = 'hve-field-section';

		const heading = document.createElement( 'p' );
		heading.className = 'hve-field-section__label';
		heading.textContent = title;
		section.appendChild( heading );

		return section;
	}

	/**
	 * @param {string} label
	 * @param {string} value
	 * @param {(value: string) => void} onChange
	 * @return {HTMLElement}
	 */
	static textInput( label, value, onChange ) {
		return this.buildLabeledInput( label, 'text', value, ( input ) => {
			input.addEventListener( 'input', () => onChange( input.value ) );
		} );
	}

	/**
	 * @param {string} label
	 * @param {number|string} value
	 * @param {(value: string) => void} onChange
	 * @return {HTMLElement}
	 */
	static numberInput( label, value, onChange ) {
		return this.buildLabeledInput( label, 'number', value, ( input ) => {
			input.addEventListener( 'input', () => onChange( input.value ) );
		} );
	}

	/**
	 * @param {string} label
	 * @param {Array<{value:string,label:string}>} options
	 * @param {string} value
	 * @param {(value: string) => void} onChange
	 * @return {HTMLElement}
	 */
	static select( label, options, value, onChange ) {
		const wrapper = document.createElement( 'label' );
		wrapper.className = 'hve-field';

		const span = document.createElement( 'span' );
		span.className = 'hve-field__label';
		span.textContent = label;
		wrapper.appendChild( span );

		const select = document.createElement( 'select' );
		select.className = 'hve-field__input';

		options.forEach( ( option ) => {
			const optionElement = document.createElement( 'option' );
			optionElement.value = option.value;
			optionElement.textContent = option.label;
			optionElement.selected = option.value === value;
			select.appendChild( optionElement );
		} );

		select.addEventListener( 'change', () => onChange( select.value ) );
		wrapper.appendChild( select );
		wrapper.input = select;

		return wrapper;
	}

	/**
	 * Seletor de fonte: um `<select>` cujas opções são renderizadas na
	 * própria fonte, servindo de pré-visualização.
	 *
	 * @param {string} label
	 * @param {Array<{value:string,label:string}>} fonts
	 * @param {string} value
	 * @param {(value: string) => void} onChange
	 * @return {HTMLElement}
	 */
	static fontSelect( label, fonts, value, onChange ) {
		const wrapper = document.createElement( 'label' );
		wrapper.className = 'hve-field';

		const span = document.createElement( 'span' );
		span.className = 'hve-field__label';
		span.textContent = label;
		wrapper.appendChild( span );

		const select = document.createElement( 'select' );
		select.className = 'hve-field__input';

		fonts.forEach( ( font ) => {
			const option = document.createElement( 'option' );
			option.value = font.value;
			option.textContent = font.label;

			if ( font.value ) {
				option.style.fontFamily = font.value;
			}

			option.selected = font.value === value;
			select.appendChild( option );
		} );

		select.addEventListener( 'change', () => onChange( select.value ) );
		wrapper.appendChild( select );
		wrapper.input = select;

		return wrapper;
	}

	/**
	 * Seletor de cor: uma caixinha visual (`input[type=color]`) ao lado de um
	 * campo de texto. A caixinha permite escolher qualquer cor; o texto
	 * aceita hex, rgb()/rgba() e nomes (ex.: `transparent`). Os dois ficam
	 * sincronizados.
	 *
	 * @param {string} label
	 * @param {string} value
	 * @param {(value: string) => void} onChange
	 * @return {HTMLElement}
	 */
	static colorInput( label, value, onChange ) {
		const wrapper = document.createElement( 'label' );
		wrapper.className = 'hve-field';

		const span = document.createElement( 'span' );
		span.className = 'hve-field__label';
		span.textContent = label;
		wrapper.appendChild( span );

		const row = document.createElement( 'span' );
		row.className = 'hve-field__color-row';

		const swatch = document.createElement( 'input' );
		swatch.type = 'color';
		swatch.className = 'hve-field__swatch';

		const text = document.createElement( 'input' );
		text.type = 'text';
		text.className = 'hve-field__input';
		text.placeholder = '#000000, rgb(...) ou nome';
		text.value = value || '';

		const initialHex = this.colorToHex( value );
		if ( initialHex ) {
			swatch.value = initialHex;
		}

		swatch.addEventListener( 'input', () => {
			text.value = swatch.value;
			onChange( swatch.value );
		} );

		text.addEventListener( 'input', () => {
			const hex = this.colorToHex( text.value );
			if ( hex ) {
				swatch.value = hex;
			}
			onChange( text.value );
		} );

		row.appendChild( swatch );
		row.appendChild( text );
		wrapper.appendChild( row );
		wrapper.input = text;

		return wrapper;
	}

	/**
	 * Converte uma cor CSS para `#rrggbb` (o único formato aceito pela
	 * caixinha nativa), ou devolve `null` quando não é possível — caso em
	 * que a caixinha simplesmente mantém o valor anterior.
	 *
	 * @param {string} value
	 * @return {string|null}
	 */
	static colorToHex( value ) {
		const v = ( value || '' ).trim();

		let m = v.match( /^#([0-9a-fA-F]{3})$/ );
		if ( m ) {
			return '#' + m[ 1 ].split( '' ).map( ( c ) => c + c ).join( '' ).toLowerCase();
		}

		m = v.match( /^#([0-9a-fA-F]{6})$/ );
		if ( m ) {
			return '#' + m[ 1 ].toLowerCase();
		}

		m = v.match( /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i );
		if ( m ) {
			const toHex = ( n ) => Math.min( 255, Number( n ) ).toString( 16 ).padStart( 2, '0' );
			return '#' + toHex( m[ 1 ] ) + toHex( m[ 2 ] ) + toHex( m[ 3 ] );
		}

		return null;
	}

	/**
	 * @param {string} label
	 * @param {boolean} checked
	 * @param {(checked: boolean) => void} onChange
	 * @return {HTMLElement}
	 */
	static checkbox( label, checked, onChange ) {
		const wrapper = document.createElement( 'label' );
		wrapper.className = 'hve-field hve-field--checkbox';

		const input = document.createElement( 'input' );
		input.type = 'checkbox';
		input.checked = checked;
		input.addEventListener( 'change', () => onChange( input.checked ) );
		wrapper.appendChild( input );

		const span = document.createElement( 'span' );
		span.textContent = label;
		wrapper.appendChild( span );

		wrapper.input = input;

		return wrapper;
	}

	/**
	 * @param {string} label
	 * @param {string} type
	 * @param {string|number} value
	 * @param {(input: HTMLInputElement) => void} bind
	 * @return {HTMLElement}
	 */
	static buildLabeledInput( label, type, value, bind ) {
		const wrapper = document.createElement( 'label' );
		wrapper.className = 'hve-field';

		const span = document.createElement( 'span' );
		span.className = 'hve-field__label';
		span.textContent = label;
		wrapper.appendChild( span );

		const input = document.createElement( 'input' );
		input.type = type;
		input.className = 'hve-field__input';
		input.value = value;
		bind( input );
		wrapper.appendChild( input );
		wrapper.input = input;

		return wrapper;
	}
}
