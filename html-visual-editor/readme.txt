=== HTML Visual Editor ===
Contributors: gessykapollynny
Tags: elementor, html widget, visual editor, page builder
Requires at least: 6.0
Tested up to: 7.0
Requires PHP: 8.0
Stable tag: 1.1.7
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Editor visual para conteúdos inseridos no Widget HTML do Elementor: edite textos, imagens, botões e estilos sem tocar em código.

== Description ==

O HTML Visual Editor resolve um problema comum de quem usa o Widget HTML do
Elementor: uma vez colado um bloco de HTML (por exemplo, gerado por IA), o
Elementor não oferece nenhuma forma visual de editar aquele conteúdo — é
tudo ou nada, direto no código.

Este plugin adiciona um editor visual sobre esse HTML. Quando um usuário com
permissão para editar a página a visualiza no site, surge um botão flutuante
"Editar HTML" que ativa o modo de edição.

No modo de edição você pode:

* Selecionar qualquer elemento compatível (títulos, parágrafos, listas,
  botões, links, imagens, seções, e mais) com realce visual e breadcrumb da
  hierarquia.
* **Conteúdo** — editar texto com um editor rich-text próprio (negrito,
  itálico, sublinhado, listas, links), além de placeholder, label, alt e
  title. Também há um editor de HTML interno quando necessário.
* **Imagens** — trocar a imagem pela Biblioteca de Mídia do WordPress ou por
  URL, ajustar alt, title, loading, width, height e imagem de fundo
  (background-image), com preview instantâneo.
* **Estilo** — cor, fundo, borda, raio, padding, margin, tipografia, layout,
  sombra, gradiente e mais, com breakpoints Desktop/Tablet/Mobile.
* **Layout** — duplicar, excluir (com confirmação), mover e agrupar
  elementos.
* **Responsivo** — valores de estilo independentes por breakpoint.

As alterações são salvas de volta no próprio Widget HTML do Elementor, via
uma API REST do plugin (com nonce e verificação de permissão), e persistem
no `_elementor_data` — nunca apenas no navegador. Há histórico de
desfazer/refazer (Ctrl+Z / Ctrl+Y) e notificações de salvamento.

O plugin é original, escrito em PHP 8 com namespace próprio e JavaScript ES6
modules, sem jQuery e sem editores de terceiros (TinyMCE/CKEditor). Os
scripts só carregam nas páginas que realmente contêm um Widget HTML.

== Installation ==

1. Envie a pasta `html-visual-editor` para `/wp-content/plugins/` (ou
   instale o arquivo .zip em Plugins > Adicionar plugin > Enviar plugin).
2. Ative o plugin no menu "Plugins" do WordPress.
3. Certifique-se de que o Elementor (Free ou Pro) está instalado e ativo.
4. Abra, logado, uma página que contenha um Widget HTML e clique no botão
   flutuante "Editar HTML".

== Frequently Asked Questions ==

= Preciso do Elementor? =

Sim. O plugin edita o conteúdo do Widget HTML do Elementor, então o
Elementor (Free ou Pro) precisa estar instalado e ativo.

= As alterações ficam salvas de verdade? =

Sim. Ao clicar em "Salvar", o HTML editado é gravado no `_elementor_data`
do post via uma rota REST própria, usando as APIs do WordPress. As mudanças
sobrevivem a recarregamentos e não dependem do editor estar carregado.

= Quem pode usar o editor? =

Apenas usuários logados com permissão para editar a página em questão
(capability `edit_post`). Visitantes anônimos nunca veem o botão nem
carregam os scripts do editor.

= Funciona com mais de um Widget HTML na mesma página? =

Sim. Cada widget é identificado pelo seu id estável do Elementor, então o
conteúdo de cada um é salvo no widget correto, sem misturar.

== Changelog ==

= 1.1.7 =
* Novo: biblioteca de fontes na aba Estilo — selecione a tipografia numa lista (fontes do sistema + Google Fonts populares) em vez de digitar o nome. A Google Font escolhida é carregada automaticamente, tanto na edição quanto no site salvo.
* Novo: seletor de cor com caixinha visual (escolha qualquer cor no quadradinho) ao lado do campo de texto (para digitar hex, rgb() ou nomes como "transparent"). Os dois ficam sincronizados.

= 1.1.6 =
* Correção: campos de tamanho na aba Estilo (font-size, width, padding, etc.) agora aceitam número puro — ao digitar "45" o plugin completa para "45px". Antes, um número sem unidade virava CSS inválido e a mudança não aparecia.
* Correção: os blocos de estilo gerenciados não se acumulam mais a cada salvamento; o antigo é substituído pelo novo.

= 1.1.5 =
* Correção: as mudanças da aba Estilo (tipografia, cor, tamanho, etc.) agora sobrepõem o CSS do próprio HTML do usuário. Antes, em conteúdos com blocos `<style>` de seletores específicos (comum em landing pages), o estilo do plugin perdia por especificidade e "não alterava nada". Agora as declarações usam `!important`.

= 1.1.4 =
* Correção de entrega/cache: cada módulo JS agora carrega com a versão do plugin no `?ver=`. Antes, os imports internos não tinham versão e o navegador continuava rodando o código antigo do cache após uma atualização — exigindo um "hard refresh". Agora as atualizações chegam automaticamente.

= 1.1.3 =
* Correção importante: o editor agora funciona também nos sites com o "DOM otimizado" do Elementor (Optimized Markup / element caching), onde o Widget HTML é renderizado sem a `.elementor-widget-container`. Antes, nesses sites, o modo de edição ligava mas nenhum elemento ficava selecionável.

= 1.1.2 =
* Correção: os outlines de seleção (azul no hover, verde ao clicar) voltam a aparecer. As variáveis de cor eram declaradas apenas em `#hve-root`, mas o SelectionManager as aplica nos elementos da página, fora desse container — o `var()` ficava inválido e o outline nunca renderizava.

= 1.1.1 =
* Correção: o painel lateral e os botões da toolbar voltam a respeitar o atributo `hidden`. Ao ancorar os estilos em `#hve-root` na 1.1.0, o plugin perdeu o `[hidden] { display: none }` que vinha por acidente do reset do tema.

= 1.1.0 =
* Modal de confirmação antes de excluir um elemento — a ação destrutiva não acontece mais com um clique só.
* Sistema de notificações (toasts) com feedback de sucesso/erro ao salvar.
* Correção: múltiplos Widgets HTML na mesma página agora são casados pelo id estável do Elementor, eliminando o risco de o conteúdo de um widget ser gravado em outro.
* Correção: estilos da interface do editor ancorados em `#hve-root`, para que o tema do site não sobrescreva as cores do plugin.

= 1.0.0 =
* Fase 1: estrutura inicial do plugin, autoloader, detecção do Widget HTML e carregamento condicional de assets.

== Upgrade Notice ==

= 1.1.7 =
Biblioteca de fontes (com Google Fonts) e seletor visual de cores na aba Estilo.
