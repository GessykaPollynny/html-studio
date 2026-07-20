=== HTML Visual Editor ===
Contributors: yourwporg
Tags: elementor, html widget, visual editor, page builder
Requires at least: 6.0
Tested up to: 6.5
Requires PHP: 8.0
Stable tag: 1.1.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Editor visual para conteúdos inseridos no Widget HTML do Elementor.

== Description ==

O HTML Visual Editor permite editar visualmente textos, imagens, botões e
estilos de qualquer HTML colado dentro do Widget HTML do Elementor — sem
precisar mexer em código.

Ao acessar a página como administrador, um botão flutuante "Editar HTML"
ativa o modo de edição: elementos compatíveis tornam-se selecionáveis, um
painel lateral permite ajustar conteúdo, imagens, estilos, layout e
responsividade, e as alterações são salvas de volta no Widget HTML original.

== Installation ==

1. Envie a pasta `html-visual-editor` para `/wp-content/plugins/`.
2. Ative o plugin no menu "Plugins" do WordPress.
3. Certifique-se de que o Elementor (Free ou Pro) está instalado e ativo.

== Changelog ==

= 1.1.1 =
* Correção: o painel lateral e os botões da toolbar voltam a respeitar o atributo `hidden`. Ao ancorar os estilos em `#hve-root` na 1.1.0, o plugin perdeu o `[hidden] { display: none }` que vinha por acidente do reset do tema.

= 1.1.0 =
* Modal de confirmação antes de excluir um elemento — a ação destrutiva não acontece mais com um clique só.
* Sistema de notificações (toasts) com feedback de sucesso/erro ao salvar.
* Correção: múltiplos Widgets HTML na mesma página agora são casados pelo id estável do Elementor, eliminando o risco de o conteúdo de um widget ser gravado em outro.
* Correção: estilos da interface do editor ancorados em `#hve-root`, para que o tema do site não sobrescreva as cores do plugin.

= 1.0.0 =
* Fase 1: estrutura inicial do plugin, autoloader, detecção do Widget HTML e carregamento condicional de assets.
