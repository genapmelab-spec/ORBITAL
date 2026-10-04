# Font licences

ORBITAL ships four font files, all of them SIL Open Font License 1.1. The full
licence text is in [OFL-1.1.txt](OFL-1.1.txt).

| Family | Files | Copyright |
|---|---|---|
| Archivo Variable (`wght` axis, latin) | `archivo-latin-wght-normal.woff2` | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) |
| Newsreader 400 roman (latin) | `newsreader-latin-400-normal.woff2` | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) |
| Newsreader 400 italic (latin) | `newsreader-latin-400-italic.woff2` | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) |
| IBM Plex Mono 400 (latin) | `ibm-plex-mono-latin-400-normal.woff2` | Copyright 2017 IBM Corp. All rights reserved. |

The files are taken from the Fontsource builds (`@fontsource-variable/archivo`,
`@fontsource/newsreader`, `@fontsource/ibm-plex-mono`), which are unmodified
redistributions of the upstream Google Fonts releases. They are subset to latin
by those builds; the `@font-face` rules live in `src/styles/fonts.css`.

Reserved Font Names: "Archivo", "Newsreader" and "IBM Plex Mono" are not
modified, so no renamed derivative is distributed here. No font is fetched from
a third-party origin at runtime.
