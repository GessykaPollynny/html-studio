# -*- coding: utf-8 -*-
"""
Atualiza o catalogo 'maiores compras' a partir do datafeed de afiliada da Shopee.
Uso:  python build.py "<URL_DO_FEED>"
Gera: index.html (site) e produtos-da-semana.md (lista pros videos).
Os 7 produtos escolhidos a mao ficam fixos em base.html; este script so
regenera a secao "Mais achados" com os campeoes do feed.
"""
import sys, csv, json, base64, urllib.request, os, html
from urllib.parse import unquote

URL = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("FEED_URL", "")
if not URL:
    print("ERRO: passe a URL do feed como argumento.")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

def fetch(url, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=timeout).read()

# 1) baixar feed
print("Baixando feed da Shopee...")
raw = fetch(URL, timeout=300)
feed_path = os.path.join(HERE, "_feed.csv")
open(feed_path, "wb").write(raw)
print("Feed baixado:", len(raw), "bytes")

# 2) curar campeoes de casa/cozinha
kw = ["cozinha","fatiador","ralador","cortador","organizador","escorredor","pia","esponja",
      "panela","tempero","pote","marmita","talher","utensil","descascador","abridor","dispenser",
      "borrifador","porta ovo","geladeira","forma","assadeira","filtro","dosador","fruteira",
      "rodo","saladeira","boleadora","suporte","tabua","copo","jarra","frigideira","wok"]
bad = ["tapete","passadeira","corredor","lava roupas","amaciante","lencol","cortina","edredom",
       "roupa de cama","toalha de banho","balm","stick multifuncional","batom","maquiagem","perfume"]
cands = []
with open(feed_path, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        if row.get("global_category1", "") not in ("Home & Living", "Home Appliances"):
            continue
        title = (row.get("title") or ""); tl = title.lower()
        if not any(k in tl for k in kw) or any(b in tl for b in bad):
            continue
        try:
            price = float(row.get("sale_price") or row.get("price") or 0)
            rating = float(row.get("item_rating") or 0)
            likes = int(float(row.get("like") or 0))
            disc = round(float(row.get("discount_percentage") or 0))
        except Exception:
            continue
        if not (5 <= price <= 65) or rating < 4.7 or likes < 3000:
            continue
        img = row.get("image_link", "") or ""
        short = row.get("product_short link", "") or ""
        if ("susercontent" not in img and "shopee" not in img) or not short.startswith("http"):
            continue
        dec = unquote(short)
        shop = dec.split("/product/")[-1].split("/")[0] if "/product/" in dec else str(len(cands))
        cands.append({"likes": likes, "rating": rating, "price": round(price, 2),
                      "disc": disc, "title": title, "img": img, "link": short, "shop": shop})

cands.sort(key=lambda x: x["likes"], reverse=True)
seen, prods = set(), []
for c in cands:
    if c["shop"] in seen:
        continue
    seen.add(c["shop"]); prods.append(c)
    if len(prods) >= 12:
        break
print("Campeoes selecionados:", len(prods))

# 3) imagens (miniatura _tn, embutida) + cartoes
def datauri(imgurl):
    try:
        data = fetch(imgurl + "_tn", timeout=30)
        return "data:image/jpeg;base64," + base64.b64encode(data).decode()
    except Exception:
        return ""

STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.8 6.5 19.5l1-6.3L3 8.9 9 8z"/></svg>'
def mil(n):
    n = int(n)
    return f"{n//1000} mil" if n >= 1000 else str(n)

cards = ['\n    <div class="section-label">\U0001F525 Mais achados de casa &amp; cozinha</div>',
         '    <div class="section-sub">os mais amados da Shopee esta semana</div>']
for c in prods:
    uri = datauri(c["img"])
    thumb = f'<img src="{uri}" alt="produto" loading="lazy">' if uri else "\U0001F6CD️"
    title = html.escape(c["title"][:60]); link = html.escape(c["link"])
    price = f'{c["price"]:.2f}'.replace(".", ",")
    deal = f'<span class="deal">-{c["disc"]}%</span>' if c["disc"] >= 10 else ""
    cards.append(f'''
    <a class="card" href="{link}" target="_blank" rel="noopener">
      {deal}
      <div class="thumb">{thumb}</div>
      <div class="info">
        <p class="pname">{title}</p>
        <div class="meta">
          <span class="price">R$ {price}</span>
          <span class="rating">{STAR}{c["rating"]}</span>
          <span class="likes">❤️ {mil(c["likes"])}</span>
        </div>
      </div>
      <span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </a>''')
feed_html = "\n".join(cards)

# 4) montar index.html a partir do base.html
base = open(os.path.join(HERE, "base.html"), encoding="utf-8").read()
out = base.replace("<!--FEED-->", feed_html)
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("index.html gerado:", len(out), "bytes")

# 5) lista pros videos
md = ["# Produtos da semana - maiores compras", "",
      "Grave 1 video por dia com estes (use a foto/video oficial da Shopee ou monte no CapCut):", ""]
for i, c in enumerate(prods, 1):
    md.append(f"{i}. **{c['title'][:70]}** - R$ {c['price']:.2f} | nota {c['rating']} | {mil(c['likes'])} curtidas")
open(os.path.join(HERE, "produtos-da-semana.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
print("produtos-da-semana.md gerado")

# 6) apagar o feed pesado (nunca commitar)
try:
    os.remove(feed_path)
except Exception:
    pass
print("OK - concluido")
