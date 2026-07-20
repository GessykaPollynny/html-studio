/**
 * MediaManager — ponte fina com a Biblioteca de Mídia nativa do WordPress
 * (`wp.media`). Não reimplementa upload/seleção de arquivos: delega
 * inteiramente à API do próprio WordPress, já carregada pelo core via
 * `wp_enqueue_media()` nas páginas onde o editor está ativo.
 */
export default class MediaManager {
	/**
	 * Abre o seletor de mídia do WordPress e entrega o attachment escolhido.
	 *
	 * @param {(attachment: {url:string,alt:string,title:string,width:number,height:number}) => void} onSelect
	 * @param {{title?:string,buttonText?:string}} [options]
	 */
	static open( onSelect, options = {} ) {
		if ( ! window.wp || ! window.wp.media ) {
			window.alert( 'A Biblioteca de Mídia do WordPress não está disponível nesta página.' );
			return;
		}

		const frame = window.wp.media( {
			title: options.title || 'Selecionar imagem',
			button: { text: options.buttonText || 'Usar esta imagem' },
			multiple: false,
			library: { type: 'image' },
		} );

		frame.on( 'select', () => {
			const attachment = frame.state().get( 'selection' ).first().toJSON();
			onSelect( attachment );
		} );

		frame.open();
	}
}
