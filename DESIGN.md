# Kima Kyami — Sistema de Design

Documento vivo do design system actual do projecto. Reflecte o código em `tailwind.config.ts`, `app/globals.css` e `app/layout.tsx` — não uma proposta, mas o que está implementado.

O produto tem **dois sistemas visuais distintos e deliberadamente separados**:

| | Loja (`app/(store)`) | Admin (`app/(admin)`) |
|---|---|---|
| Nome | — (identidade Kima Kyami) | "Kinetic Elegance" |
| Sensação | Editorial, luxo, atmosférico | Utilitário, limpo, profissional |
| Fundo base | Cream `#eadeca` | Bone `#FBF9F5` |
| Escuro | Noir `#181818` | Charcoal `#1A1A1A` |
| Acento | Gold `#f7c480` | Gold `#D4AF37` |

Nunca misturar tokens entre os dois sistemas — usar `text-noir` num ecrã de admin (ou `text-a-charcoal` na loja) é um bug, já corrigido uma vez no histórico do projecto.

---

## 1. Cor

### Loja
```
cream   #eadeca   bg-cream    — fundo principal das secções claras
noir    #181818   bg-noir     — fundo das secções escuras / texto principal
gold    #f7c480   text-gold   — acento, hover, detalhe de luxo
muted   #9a9a9a   text-muted  — texto secundário
```
Variações de opacidade usam a notação Tailwind `/`, ex. `text-noir/60`, `bg-noir/85`, `border-noir/8` (bordas quase invisíveis, só para separar secções sobre fundo claro).

### Admin — Kinetic Elegance
```
a-bone     #FBF9F5   bg-a-bone      — fundo da aplicação
a-charcoal #1A1A1A   text-a-charcoal — texto principal, botões primários
a-gold     #D4AF37   text-a-gold    — acento, estados activos, hover
a-muted    #6B6B6B   text-a-muted   — texto secundário, labels
a-border   #DBDAD6   border-a-border — bordas de cartões e inputs
```
Cartões usam sempre `bg-white border border-a-border rounded-lg shadow-sm` sobre o fundo `bg-a-bone` — nunca `rounded-xl` nem `border-gray-*`.

### Estados semânticos (ambos os sistemas)
Usam a paleta Tailwind directa, não tokens de marca — verde/âmbar/vermelho/azul/roxo/índigo/ciano consoante o estado (ex. `bg-emerald-50 text-emerald-700 border-emerald-200` para "Confirmada/Activa", `bg-red-50 text-red-700 border-red-200` para "Cancelada/erro").

---

## 2. Tipografia

Quatro famílias carregadas via `next/font/google` em `app/layout.tsx`, expostas como variáveis CSS:

| Variável | Fonte | Uso |
|---|---|---|
| `--font-serif` → `font-serif` | Cormorant Garamond (300/400/600/700) | Títulos da loja — h1/h2, aspas, logótipo textual |
| `--font-sans` → `font-sans` | Montserrat (300/400/500/600) | Corpo de texto e UI da loja |
| `--font-display` → `font-display` | EB Garamond (400/500/600) | Títulos do admin |
| `--font-ui` → `font-ui` | Inter (300/400/500/600) | Corpo de texto e UI do admin |

### Escala de tamanho (loja)
```
text-hero        clamp(40px, 8vw, 76px)   — H1 da hero
text-title-lg     clamp(28px, 4vw, 42px)   — títulos de secção principais
text-title-md     clamp(22px, 3vw, 34px)   — subtítulos, citações
text-nav-mobile   clamp(26px, 7vw, 40px)   — menu mobile fullscreen
```
O admin não tem escala própria — usa tamanhos Tailwind normais (`text-2xl`, `text-sm` etc.) porque os ecrãs são mais densos em informação, não editoriais.

### Letter-spacing (tracking)
```
tracking-spaced       .12em   — texto corrido com destaque
tracking-spaced-lg    .18em   — botões, labels de secção
tracking-spaced-xl    .22em   — eyebrows ("A MARCA", "EM BREVE")
tracking-spaced-max   .35em   — monograma "KK", elementos muito espaçados
```
Regra visual recorrente na loja: **texto pequeno (9–11px) + uppercase + tracking largo** para toda a microcópia (labels, botões, eyebrows). É a assinatura tipográfica da marca — nunca usar texto pequeno sem uppercase+tracking na loja.

---

## 3. Espaçamento e grelha

### Container
`.container-kk` — largura máxima 1440px, centrado, padding horizontal responsivo:
```
mobile   px-8   (2rem)
sm+      px-12  (3rem)
lg+      px-20  (5rem)
```

### Ritmo vertical entre secções
`.section-py` (topo+baixo) e `.section-pb` (só baixo) seguem uma escala progressiva suave — **nunca** o tablet deve ter mais espaço que o desktop:
```
mobile (< 768px)   4rem    (64px)
md (768–1279px)    4.5rem  (72px)
xl (≥ 1280px)       5rem    (80px)
```

### Breakpoints
```
xs   480px   sm   640px   md   768px
lg   1024px  xl   1280px  2xl  1536px
```

---

## 4. Componentes

### Botões — Loja
Padrão dominante: rectangular (sem `rounded`), texto 10–11px uppercase com tracking largo, altura mínima táctil.
```html
<!-- Primário (sólido) -->
class="bg-noir text-cream text-[11px] tracking-[0.3em] uppercase min-h-14 hover:bg-noir/85"

<!-- Secundário (contorno) -->
class="border border-noir text-noir text-[10px] tracking-[0.25em] uppercase px-10 py-3.5 hover:bg-noir hover:text-cream"
```
Regra crítica: se o botão define `min-h-*`, **não** empilhar também `py-*` — um `<button>` nativo já centra o conteúdo verticalmente por defeito do browser, mas um `<Link>`/`<a>` ou uma `<div>` não. Nesses casos usar `flex items-center justify-center` explícito (bug já corrigido no `CartSidebar`).

### Botões — Admin
Cantos arredondados (`rounded-lg`), mais compactos:
```html
<!-- Primário -->
class="bg-a-charcoal text-white text-[10px] tracking-[0.18em] uppercase px-6 min-h-12 rounded-lg hover:bg-a-charcoal/90"

<!-- Ghost/ícone -->
class="p-1.5 rounded text-a-muted hover:text-a-gold hover:bg-a-gold/10"
```

### Inputs
Loja: sem cantos arredondados, fundo cream, foco dourado.
```html
class="w-full border border-noir/20 px-4 py-3 text-sm bg-cream focus:border-gold"
```
Admin: cantos arredondados, fundo branco.
```html
class="w-full bg-white border border-a-border text-[13px] px-4 py-2.5 rounded-lg focus:border-a-gold"
```

### Cartões / painéis
- Loja: `border border-noir/10` sobre `bg-cream`, sem sombra — a separação é feita por borda fina, não por elevação.
- Admin: `bg-white border border-a-border rounded-lg shadow-sm` — elevação subtil sempre presente.

### Estados vazios (admin)
Ícone `lucide-react` (28px, `strokeWidth={1}`) num círculo `bg-a-bone border border-a-border`, seguido de texto `text-sm text-a-muted`. Usado consistentemente em produtos/encomendas/pagamentos/clientes.

### Badges de estado
Pílula pequena: `text-[9px] px-2 py-0.5 rounded font-medium` + par de cores semânticas (`bg-*-50 text-*-700 border border-*-200`).

---

## 5. Iconografia

Biblioteca única: **lucide-react**. Convenções:
- `strokeWidth={1.5}` é o padrão geral.
- `strokeWidth={1}` para ícones grandes/decorativos (estados vazios, marcas d'água).
- `strokeWidth={2}` reservado para ícones pequenos que precisam de mais peso visual (fechar, alertas).
- Tamanhos típicos: 12–16px em botões e inputs, 18–22px em estados vazios, 28px+ em destaques.

---

## 6. Imagens

### Loja — fotografia editorial
Todas as imagens de marketing usam `next/image` com `fill` + `object-cover`, nunca `object-contain` — a estética depende de fotografia a preencher a zona por completo, sem barras vazias.

15 zonas de imagem são **geridas pelo admin** (`/admin/imagens`, tabela `ImagemSite`, fonte de verdade em `lib/imagens-site.ts`), cada uma com proporção fixa própria:

| Zona | Proporção | Largura de upload |
|---|---|---|
| Hero (home / marca) | 3:2 | 2400px |
| Grelha de categorias (×4) | 3:4 | 1600px |
| Citação | 4:5 | 1800px |
| Exclusividade (×2) | 4:5 | 1600px |
| Editorial "A Marca" | 4:3 | 1800px |
| Lookbook — destaque grande | 4:5 | 2000px |
| Lookbook — restantes (×4) | 4:5 | 1600px |

Ao carregar uma imagem para qualquer destas zonas, o Cloudinary aplica `crop:'fill', gravity:'auto'` — recorta à proporção exacta da zona detectando automaticamente o assunto principal da foto, em vez de um corte central cego. `quality:'auto:best'` prioriza nitidez sobre tamanho de ficheiro.

### Produto
Imagens de produto (galeria em `/produto/[slug]`) não têm proporção fixa imposta — `crop:'limit'` a 1400px, sem recorte forçado.

### Logótipo
Duas variantes SVG, **não** geridas pelo admin (activo de marca, não conteúdo):
- `/logo.svg` — versão escura, para fundo claro (navbar, secções cream)
- `/logo-cream.svg` — versão clara, para fundo escuro (menu mobile, secções noir)

---

## 7. Movimento

Duas animações CSS definidas em `globals.css`, ambas respeitam `prefers-reduced-motion: reduce`:
```
kk-fade-up   0.9s  — entrada de texto na hero (opacity + translateY 28px)
kk-pop       0.3s  — badge do carrinho a incrementar (scale bounce)
```
Transições de hover/focus são globais e uniformes: `transition-colors duration-300` (loja tende a 300ms; admin usa o Tailwind por defeito, mais rápido, ~150ms) aplicado a `a, button, input, select, textarea`.

---

## 8. Acessibilidade

- Foco visível global: `outline: 2px solid var(--color-gold); outline-offset: 2px` via `:focus-visible`.
- Skip-link ("Saltar para o conteúdo") no layout da loja.
- Todos os botões-ícone têm `aria-label`.
- Toggle switches e diálogos de confirmação (`confirm()`) usados no admin para acções destrutivas (desactivar conta bancária, repor imagem).

---

## 9. Voz da microcópia

Interface inteiramente em português europeu. Convenções:
- CTAs em maiúsculas, tracking largo: "DESCOBRIR COLEÇÃO", "VER TODOS".
- Eyebrows (rótulos pequenos acima de títulos) sempre em maiúsculas: "A MARCA", "EM BREVE", "EDITORIAL".
- Admin usa frases de acção directas e curtas: "Guardar alterações", "A processar…", "Repor imagem original".

---

*Última actualização: reflecte o código após a introdução do sistema de imagens do site com recorte inteligente (commit `3bb8a33`).*
