# Relatório — HTML Visual Editor

_Última atualização: 17/07/2026_

Plugin WordPress original para editar visualmente o conteúdo de Widgets HTML
do Elementor (textos, imagens, botões, estilos) sem tocar em código.
Repositório: https://github.com/GessykaPollynny/html-studio

---

## 1. Estado do repositório

- Git inicializado na branch `main`, com histórico já enviado ao GitHub.
- 51 arquivos versionados dentro de `html-visual-editor/`.
- `.gitignore` exclui `html-visual-editor.zip` (build) e `.claude/` (config local da sessão).
- **Para continuar no outro computador:** `git clone https://github.com/GessykaPollynny/html-studio.git`.

## 2. O que foi construído (Fases 1–10, todas completas)

| Fase | Entregável | Arquivos principais |
|---|---|---|
| 1 | Estrutura do plugin, autoloader PSR-4 próprio, ativação/desativação, detecção do Widget HTML com cache | `plugin.php`, `includes/Autoloader.php`, `includes/Plugin.php`, `includes/Elementor/HtmlWidgetDetector.php` |
| 2 | Botão flutuante "Editar HTML", marcação dos widgets editáveis | `assets/js/modules/Toolbar.js`, `Editor.js` |
| 3 | Seleção por hover/clique (outline azul/verde), breadcrumb de hierarquia | `SelectionManager.js`, `DOMInspector.js`, `Breadcrumb.js` |
| 4 | Painel lateral com abas (Conteúdo, Imagens, Estilo, Layout, Responsivo) | `Panel.js`, `tabs/LayoutTab.js`, `tabs/ResponsiveTab.js` |
| 5 | Editor de texto rich-text próprio (contenteditable + `execCommand`, sem TinyMCE/CKEditor) | `RichTextToolbar.js`, `tabs/ContentTab.js` |
| 6 | Edição de imagens via Media Library nativa do WordPress (`wp.media`) | `MediaManager.js`, `tabs/ImagesTab.js` |
| 7 | Editor de estilos (cor, fundo, borda, **padding/margin**, tipografia, layout, sombra, gradiente) com breakpoints Desktop/Tablet/Mobile | `StyleManager.js`, `tabs/StyleTab.js`, `ResponsiveState.js` |
| 8 | Histórico undo/redo (Ctrl+Z / Ctrl+Y), snapshot com debounce | `HistoryManager.js`, `KeyboardShortcuts.js` |
| 9 | Salvamento real no `_elementor_data` via endpoint REST próprio (nonce + capability check) | `StorageManager.js`, `frontend/RestSaveController.php` |
| 10 | Otimizações: `MutationObserver` (nunca reprocessa o DOM inteiro), cache em memória dos widgets editáveis | `DomWatcher.js`, `constants.js` |

Arquitetura: namespace PHP `HTMLVisualEditor\{Includes,Admin,Frontend}`,
JS 100% ES6 modules sem dependências externas, PSR-12/SOLID no PHP.

## 3. Testado ao vivo (WordPress real: `quantimob.usuart.com`, WP 6.7.5 + Elementor 4.1.1)

Confirmado funcionando de ponta a ponta, com prova de persistência (reload
completo, aba nova sem cache de estado):

- Ativação do plugin, detecção do widget, botão flutuante.
- Seleção de elemento, edição de texto rich-text, salvar → persiste no
  Widget HTML real (sobrevive a reload).
- **Padding e Margin para imagens e containers** (pedido explícito) — testado,
  aplica corretamente, persiste, e o HTML salvo é autocontido (`<style
  data-hve-managed="true">` embutido, funciona mesmo sem o JS do editor).
- Duplicar elemento, Desfazer (Ctrl+Z) e Refazer (Ctrl+Y) — revertem e reaplicam
  corretamente.
- Breakpoints responsivos (Desktop/Tablet) — valores independentes por
  breakpoint, confirmados após salvar e recarregar.
- Integração real com `wp.media` (o modal abre corretamente); a seleção de
  um arquivo já existente não pôde ser testada porque a Biblioteca de Mídia
  do site estava vazia e a ferramenta de automação usada não consegue abrir
  o seletor de arquivos do sistema operacional.

### Bugs reais encontrados e corrigidos durante o teste ao vivo

1. **Detecção do widget falhava sempre.** O código comparava
   `_elementor_edit_mode === '1'`, mas o Elementor grava a string `'builder'`.
   Corrigido em `includes/Elementor/HtmlWidgetDetector.php`.
2. **O script nunca carregava como ES module.** `wp_script_add_data($handle,
   'type', 'module')` não é reconhecido pelo core do WordPress — nunca
   funcionou. Trocado pelo filtro `script_loader_tag`, compatível com WP 6.0+.
   Corrigido em `frontend/AssetManager.php`.
3. **Perda de estilos após Desfazer/Refazer.** O `data-hve-style-id` de um
   elemento era resolvido só por identidade de objeto (`WeakMap`); depois de
   um undo/redo (que recria os nós via `innerHTML`), um elemento que já tinha
   estilos salvos ganhava um id novo, sobrescrevendo o atributo antigo e
   perdendo as regras já aplicadas. Corrigido em
   `assets/js/modules/StyleManager.js` — agora `getElementId()` reaproveita o
   atributo `data-hve-style-id` já existente no DOM em vez de sempre cunhar um
   novo id.

## 3.1 Auditoria do escopo original (20/07/2026)

Conferência item a item do briefing original contra o código: **~95%
implementado**. Estavam presentes e verificados no código: estrutura de
pastas, arquitetura (PHP 8+/namespace/ES6 modules/CSS puro/sem jQuery),
as 5 abas completas (Conteúdo, Imagens com preview, as 20 propriedades de
Estilo, as 8 ações de Layout incl. agrupar/desagrupar, Responsivo), os 7
comandos do rich text próprio, undo/redo, salvamento real, as 25 tags
suportadas, performance (MutationObserver + event delegation + cache) e
segurança.

Lacunas encontradas e **já fechadas** nesta data:

- **Modal de confirmação** (`ConfirmDialog.js`) — o "Excluir" da aba Layout
  apagava o elemento sem perguntar. Agora toda exclusão passa por
  confirmação explícita, com o foco iniciando em "Cancelar" e Esc/clique no
  fundo cancelando. Coberto por testes, inclusive a garantia negativa (não
  confirmar ⇒ elemento permanece no DOM).
- **Sistema de notificações** (`Notifications.js`) — antes o único feedback
  era o texto do botão Salvar. Agora há toasts de sucesso/erro, acessíveis
  (`aria-live`), com dark mode e respeito a `prefers-reduced-motion`.

Lacunas **ainda abertas** do escopo original:

- **Nomes de módulos divergentes do briefing**: pedido `ResponsiveManager`
  (existe `ResponsiveState.js`, que cumpre a função) e `Renderer` (não
  existe; as responsabilidades estão em `Panel.js` + `FieldBuilder.js`).
  Funcional, mas foge do contrato de arquitetura especificado.
- **Loading**: existe apenas como estado do botão Salvar ("Salvando..."),
  sem indicador dedicado.

## 4. O que falta / pendências conhecidas

- **Múltiplos Widgets HTML na mesma página** — _blindado no código
  (18/07/2026)._ O salvamento agora casa cada widget pelo `id` estável do
  Elementor (`data-id` no DOM ↔ chave `"id"` em `_elementor_data`), com a
  ordem de percurso mantida apenas como fallback de compatibilidade. Isso
  elimina o risco de o conteúdo de um widget vazar para outro quando a ordem
  do DOM diverge da ordem no `_elementor_data`. Arquivos:
  `assets/js/modules/StorageManager.js` (envia `elementId`) e
  `frontend/RestSaveController.php` (`apply_to_elements` casa por id).
  **Ainda falta validar ao vivo** numa página com dois ou mais Widgets HTML.
- **Seleção de imagem já existente na Media Library** — não testada de fato
  (biblioteca do site de teste estava vazia; precisa de upload manual de ao
  menos uma imagem para completar o teste).
- **Testes automatizados** — _iniciados (20/07/2026)._ Base de testes JS com
  **Jest + jsdom** na raiz do repositório (`package.json`, `jest.config.cjs`,
  `babel.config.cjs`, `tests/`), fora da pasta do plugin para não ir no
  build. `npm test` roda 9 testes cobrindo o coração do salvamento no
  frontend: `resolveElementId` (a correção de múltiplos widgets, incl. o
  caso de dois ids distintos sem colisão), `stripEditingArtifacts`,
  `collectStyleIds` e `buildSavableHtml`. **Ainda falta:** PHPUnit para o
  backend (`RestSaveController::apply_to_elements`, `HtmlWidgetDetector`) —
  não montado aqui porque a máquina de desenvolvimento atual não tem PHP
  instalado; roda em CI ou em ambiente com PHP.
- **Auditoria de segurança** — _feita (20/07/2026)._ Revisão dedicada das
  superfícies sensíveis: endpoint REST `/save` (nonce `X-WP-Nonce` validado
  pelo core, `permission_callback` com `current_user_can('edit_post')`,
  `postId` via `absint`, casts explícitos), sanitização do HTML salvo
  (`wp_kses_post` para quem não tem `unfiltered_html`), carregamento de
  assets gated por `EditableContext`, SQL do `uninstall.php` com
  `$wpdb->prepare`, saída no admin com `esc_html__`, e sinks de `innerHTML`
  no JS. **Nenhuma vulnerabilidade encontrada.** Aplicada uma limpeza:
  removidos `ajaxUrl` e o nonce `hve_editor_action` do `wp_localize_script`
  (`frontend/AssetManager.php`) por serem código morto (sem handler
  admin-ajax e sem uso no JS). Riscos aceitos por design, registrados aqui:
  (a) usuários com `unfiltered_html` podem salvar HTML bruto — intencional e
  idêntico ao próprio Widget HTML do Elementor; (b) o "Editar HTML interno"
  (`ContentTab.js`) é um caso de self-XSS (só afeta a sessão de quem edita o
  próprio conteúdo), com a sanitização no servidor como rede de proteção
  real. Observação: não substitui um pentest formal, mas cobre as
  superfícies relevantes de um plugin WordPress.
- **Compatibilidade não testada** com Elementor Pro, outros temas, ou o
  "editor atômico" (containers novos) do Elementor v4 além do Widget HTML
  clássico.
- **Polimento de publicação** — `readme.txt` básico, sem ícone/banner, não
  preparado para o repositório oficial de plugins do WordPress.org.
- **Cache de módulos JS**: como os `import` internos não usam query string de
  versão (só o `main.js` principal tem `?ver=`), depois de qualquer
  atualização de um arquivo já em produção, navegadores com cache antigo do
  módulo podem continuar executando a versão anterior até um hard-reload.
  Não afeta visitantes novos, mas vale considerar versionar os imports no
  futuro.

## 5. Ambiente de teste ao vivo

- Site: `https://quantimob.usuart.com/wp-admin` — usuário `Claude`.
- Página de teste: "Teste HTML Visual Editor" (post id 15), com um Widget
  HTML contendo heading, parágrafo, link, botão e imagem.
- O plugin está ativo no site com a versão corrigida (idêntica ao que está
  neste repositório).
- **Atenção:** a sessão de login expira; ao retomar os testes é preciso logar
  de novo manualmente (login/senha não ficam registrados nesta conversa por
  política de segurança).
