/**
 * ResponsiveState — estado compartilhado do breakpoint ativo no editor.
 *
 * Pequeno store observável (sem dependências) consumido pela aba
 * Responsivo (Fase 4) e pelo StyleManager (Fase 7), que grava/lê regras
 * de estilo por breakpoint sem que as duas abas precisem se conhecer.
 */
class ResponsiveState {
	constructor() {
		this.current = 'desktop';
		this.listeners = new Set();
	}

	/**
	 * @return {'desktop'|'tablet'|'mobile'}
	 */
	get() {
		return this.current;
	}

	/**
	 * @param {'desktop'|'tablet'|'mobile'} breakpoint
	 */
	set( breakpoint ) {
		if ( breakpoint === this.current ) {
			return;
		}

		this.current = breakpoint;
		this.listeners.forEach( ( listener ) => listener( breakpoint ) );
	}

	/**
	 * @param {(breakpoint: string) => void} listener
	 * @return {() => void} Função para cancelar a inscrição.
	 */
	subscribe( listener ) {
		this.listeners.add( listener );
		return () => this.listeners.delete( listener );
	}
}

export default new ResponsiveState();
