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
