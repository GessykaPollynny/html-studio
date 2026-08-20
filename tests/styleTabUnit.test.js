/**
 * Testes de withUnit — a coerção de unidade da aba Estilo.
 *
 * Trava o bug vivido no usuart.com: digitar "45" no campo Tamanho gerava
 * `font-size: 45` (CSS inválido, ignorado pelo navegador), então a mudança
 * "não alterava nada".
 */

import { withUnit } from '../html-visual-editor/assets/js/modules/tabs/StyleTab.js';

describe( 'withUnit', () => {
	test( 'completa número puro com px em propriedades de comprimento', () => {
		expect( withUnit( 'font-size', '45' ) ).toBe( '45px' );
		expect( withUnit( 'width', '320' ) ).toBe( '320px' );
		expect( withUnit( 'border-radius', '8' ) ).toBe( '8px' );
		expect( withUnit( 'padding', '16' ) ).toBe( '16px' );
	} );

	test( 'não mexe em valor que já tem unidade ou palavra-chave', () => {
		expect( withUnit( 'font-size', '45px' ) ).toBe( '45px' );
		expect( withUnit( 'width', '100%' ) ).toBe( '100%' );
		expect( withUnit( 'font-size', '2rem' ) ).toBe( '2rem' );
		expect( withUnit( 'margin', '0 auto' ) ).toBe( '0 auto' );
	} );

	test( 'não acrescenta px em line-height nem opacity (aceitam número puro)', () => {
		expect( withUnit( 'line-height', '1.5' ) ).toBe( '1.5' );
		expect( withUnit( 'opacity', '0.8' ) ).toBe( '0.8' );
	} );

	test( 'não mexe em propriedades que não são comprimento', () => {
		expect( withUnit( 'color', '#000000' ) ).toBe( '#000000' );
		expect( withUnit( 'font-weight', '700' ) ).toBe( '700' );
	} );

	test( 'aceita número decimal e faz trim', () => {
		expect( withUnit( 'letter-spacing', '  2  ' ) ).toBe( '2px' );
		expect( withUnit( 'font-size', '' ) ).toBe( '' );
	} );
} );
