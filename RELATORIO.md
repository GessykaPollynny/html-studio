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

## 4. O que falta / pendências conhecidas

- **Múltiplos Widgets HTML na mesma página** — nunca testado. O salvamento
  mapeia cada widget por índice (`RestSaveController::apply_to_elements`);
  existe risco teórico de o conteúdo de um widget vazar para outro se a
  ordem de percurso do DOM divergir da ordem no `_elementor_data`. **Este é o
  próximo teste prioritário.**
- **Seleção de imagem já existente na Media Library** — não testada de fato
  (biblioteca do site de teste estava vazia; precisa de upload manual de ao
  menos uma imagem para completar o teste).
- **Sem testes automatizados** (nem PHPUnit nem Jest) — toda a validação foi
  manual/exploratória num navegador.
- **Sem auditoria de segurança formal** — nonce, capability check
  (`current_user_can('edit_post', ...)`) e sanitização (`wp_kses_post` /
  `unfiltered_html`) seguem os padrões do WordPress, mas não houve revisão
  dedicada de segurança.
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
