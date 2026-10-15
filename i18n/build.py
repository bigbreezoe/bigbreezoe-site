"""Build translated copies of the Big Breezoe homepage.

    python i18n/build.py            # writes public/<lang>/index.html for every language file in i18n/
    python i18n/build.py --extract  # only refreshes i18n/en.json (the English source list)

How it works
- The English page (site-new/index.html) is the only source. Never edit the generated pages.
- Visible text is split into segments. Each segment's key is a short hash of its English text.
- <lang>.json maps those keys to translations. If you change English copy, its key changes,
  the build reports it as missing, and that line falls back to English until it is translated.
"""
import hashlib, html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent
SITE = ROOT.parent / 'public'
SRC = SITE / 'index.html'
BODY_END = '<script src="/store/store-config.js'
INLINE = {'b', 'em', 'strong', 'a', 'br'}
VOID = {'br', 'input', 'img', 'meta', 'link', 'hr', 'source', 'wbr'}
LANGS = [  # code, hreflang/html lang, native name, button label
    ('en', 'en', 'English', 'EN'),
    ('es', 'es', 'Español', 'ES'),
    ('fr', 'fr', 'Français', 'FR'),
    ('hi', 'hi', 'हिन्दी', 'HI'),
    ('zh', 'zh-Hans', '中文', 'ZH'),
]
# Brand and product names that stay in English on every page (keys from en.json).
KEEP = set("""15587ab31f 558865a16f fc49f156a2 5721bbef40 c032adc1ff e8ea5fe2a6 6b6390a441 c59a8125e0
82da67b211 78483b1d68 8b0f300caa b0dacbd850 a5b966cdcb 729b9130b2 c858870c20 0a757af41c a94431ee22 1599e659c3 800af222a7
2be5f64b36 2c2f90e47e 04771540cb b69a8d8e93 fc64b48ce7 6f92cd92bf 8fde3a62fa 956b5a5724""".split())
TAG = re.compile(r'<!--.*?-->|<(/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(/?)>', re.S)


def key(text):
    return hashlib.sha1(' '.join(text.split()).encode('utf-8')).hexdigest()[:10]


def has_words(text):
    t = html.unescape(re.sub(r'<[^>]+>', '', text))
    return re.search(r'[A-Za-z]', t) is not None


def masked(region):
    """Blank out SVGs and the language switcher so they are never translated (keeps offsets)."""
    def blank(m):
        return ' ' * len(m.group(0))
    region = re.sub(r'<svg.*?</svg>', blank, region, flags=re.S)
    region = re.sub(r'<!--lang-->.*?<!--/lang-->', blank, region, flags=re.S)
    return region


def segments(region):
    """Return [(start, end, text)] for every translatable chunk of the body region."""
    m_region = masked(region)
    stack, found = [], []
    for m in TAG.finditer(m_region):
        if m.group(0).startswith('<!--'):
            continue
        closing, name = m.group(1) == '/', m.group(2).lower()
        if not closing:
            if name in VOID or m.group(4):
                continue
            stack.append((name, m.end()))
            continue
        while stack and stack[-1][0] != name:
            stack.pop()
        if not stack:
            continue
        _, start = stack.pop()
        inner = m_region[start:m.start()]
        inner_tags = {t.group(2).lower() for t in TAG.finditer(inner) if t.group(2)}
        if has_words(inner) and inner_tags <= INLINE:
            found.append((start, m.start()))
    # keep only outermost qualifying elements
    found.sort(key=lambda x: (x[0], -x[1]))
    outer = []
    for s, e in found:
        if outer and s >= outer[-1][0] and e <= outer[-1][1]:
            continue
        outer.append((s, e))
    # leftover bare text nodes outside those elements
    covered = outer[:]
    for t in re.finditer(r'>([^<>]+)<', m_region):
        s, e = t.start(1), t.end(1)
        if any(a <= s and e <= b for a, b in covered):
            continue
        if has_words(t.group(1)):
            outer.append((s, e))
    out = []
    for s, e in sorted(outer):
        raw = region[s:e]
        core = raw.strip()
        if not core:
            continue
        lead = len(raw) - len(raw.lstrip())
        out.append((s + lead, s + lead + len(core), core))
    return out


def split(page):
    b0 = page.index('<body>')
    b1 = page.index(BODY_END)
    return page[:b0], page[b0:b1], page[b1:]


def extract():
    page = SRC.read_text(encoding='utf-8')
    _, region, _ = split(page)
    en = {}
    for _, _, text in segments(region):
        en.setdefault(key(text), text)
    (ROOT / 'en.json').write_text(json.dumps(en, ensure_ascii=False, indent=1), encoding='utf-8')
    return page, en


def switcher(code, label='Language'):
    cur = next(l for l in LANGS if l[0] == code)
    links = ''.join(
        '<a href="{href}" hreflang="{hl}" lang="{hl}"{cur}>{name} <small>{lab}</small></a>'.format(
            href='/' if c == 'en' else '/%s/' % c, hl=hl, name=name, lab=lab,
            cur=' aria-current="page"' if c == code else '')
        for c, hl, name, lab in LANGS)
    return ('<!--lang--><details class="lang"><summary aria-label="{label}: {name}">'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/>'
            '<path d="M2.5 12h19M12 2.5c2.6 2.6 3.9 5.8 3.9 9.5s-1.3 6.9-3.9 9.5M12 2.5C9.4 5.1 8.1 8.3 8.1 12s1.3 6.9 3.9 9.5"/></svg>'
            '<span>{lab}</span></summary><div class="lang-menu">{links}</div></details><!--/lang-->'
            ).format(label=label, name=cur[2], lab=cur[3], links=links)


def attr_sub(text, mapping):
    def f(m):
        v = html.unescape(m.group(2))
        if v in mapping:
            return '%s="%s"' % (m.group(1), html.escape(mapping[v], quote=True))
        return m.group(0)
    return re.sub(r'(aria-label|placeholder|title|alt)="([^"]*)"', f, text)


def build(code, page, en):
    data = json.loads((ROOT / ('%s.json' % code)).read_text(encoding='utf-8'))
    hl = next(l[1] for l in LANGS if l[0] == code)
    strings, attrs, meta = data['strings'], data.get('attrs', {}), data['meta']
    head, region, tail = split(page)

    # body text
    missing = [k for k in en if k not in strings and k not in KEEP]
    unused = [k for k in strings if k not in en]
    for s, e, text in reversed(segments(region)):
        t = strings.get(key(text))
        if t is not None:
            region = region[:s] + t + region[e:]
    region = attr_sub(region, attrs)
    region = re.sub(r'<!--lang-->.*?<!--/lang-->', switcher(code, meta.get('lang_label', 'Language')), region, flags=re.S)
    note = '<div class="lang-note" lang="%s"><p>%s</p></div>' % (hl, data['note'])
    region = region.replace('<!--/lang-->\n</div></header>', '<!--/lang-->\n</div></header>\n' + note, 1)

    # head
    url = 'https://bigbreezoe.com/%s/' % code
    head = head.replace('<html lang="en">', '<html lang="%s">' % hl, 1)
    head = head.replace('<link rel="canonical" href="https://bigbreezoe.com/">',
                        '<link rel="canonical" href="%s">' % url, 1)
    head = head.replace('<meta property="og:url" content="https://bigbreezoe.com/">',
                        '<meta property="og:url" content="%s">\n<meta property="og:locale" content="%s">' % (url, meta['og_locale']), 1)
    esc = lambda v: html.escape(v, quote=True)
    head = re.sub(r'<title>.*?</title>', '<title>%s</title>' % html.escape(meta['title'], quote=False), head, 1)
    for prop in ('og:title', 'og:description', 'og:image:alt'):
        head = re.sub(r'(<meta property="%s" content=")[^"]*(">)' % re.escape(prop),
                      lambda m, v=meta[prop.replace('og:', '').replace(':', '_')]: m.group(1) + esc(v) + m.group(2), head, 1)
    head = re.sub(r'(<meta name="description" content=")[^"]*(">)',
                  lambda m: m.group(1) + esc(meta['description']) + m.group(2), head, 1)

    # script strings
    tail = tail.replace(BODY_END, '<script>window.BB_I18N=%s;</script>\n%s' % (
        json.dumps(data['js'], ensure_ascii=False), BODY_END), 1)

    out = SITE / code / 'index.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(head + region + tail, encoding='utf-8', newline='')
    return missing, unused


if __name__ == '__main__':
    page, en = extract()
    print('English source: %d segments -> i18n/en.json' % len(en))
    if '--extract' in sys.argv:
        sys.exit()
    bad = False
    for code, *_ in LANGS[1:]:
        if not (ROOT / ('%s.json' % code)).exists():
            print('%s: no translation file, skipped' % code)
            continue
        missing, unused = build(code, page, en)
        print('%s: built public/%s/index.html, %d missing, %d stale' % (code, code, len(missing), len(unused)))
        for k in missing:
            bad = True
            print('   missing %s  %s' % (k, en[k][:70]))
        for k in unused:
            print('   stale   %s' % k)
    sys.exit(1 if bad else 0)
