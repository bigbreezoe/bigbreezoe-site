# Home page translations (es, fr, hi, zh)

`public/index.html` is the only source. The pages at `public/es/`, `public/fr/`, `public/hi/` and `public/zh/` are generated. Do not edit them by hand.

After you change text on the English home page, or the Gear, Shop or service text in `public/store/store-config.js`:

```
python i18n/build.py
```

The build lists any English line that has no translation yet. Those lines show in English on the translated pages until you add them. Exit code 1 means something is missing.

- Static page text: add the key from `i18n/en.json` to `"strings"` in each language file. Keep HTML tags and links exactly as in English.
- Gear, Shop menu and button labels: they live under `"js"` in each language file. Gear items are matched by their English name. Brand names stay in English.
- Brand and product names that never translate are listed in `KEEP` in `build.py`.
- The labels "I use this", "I've used it" and "Researched, not used" must keep the same meaning in every language (site rule 7).

Videos, emails, sessions, the store, and the legal pages stay in English. The translated pages say so in the notice under the header.

Needs review by native speakers: Hindi and Chinese. Hindi first-person lines use masculine verb forms for Cris.
