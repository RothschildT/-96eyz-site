# Mawon Freedom Arts

The website for Mawon Freedom Arts, a multimedia house founded by Roth$child. 96 EYZ is its music arm.

**Live:** https://rothschildt.github.io/-96eyz-site/

The home page is a half circle of five congas with Music in the middle. Click a drumhead to go through it. You can also play the drums with the **A S D F G** keys.

## Two versions of the home page

- **A, the night stage:** `/` (black). This is the main one.
- **B, the day stage:** `/day/` (white stage, black drums). Not linked anywhere and hidden from search engines. Delete the `day/` folder once you've picked.

## How it's put together

Plain static HTML, CSS and JS. No framework.

```
index.html            home, version A
day/                  home, version B
about/ music/ writing/ photos/ contact/
writing/writing-my-wrongs/   the full piece, word for word
brand/                brand sheet: wordmark, seal, 96 EYZ emblem (not linked in the nav)
404.html              "Wrong drum."
assets/css/site.css   all styles
assets/js/stage.js    the 3D set: drums, sound, ripple, dive transition
assets/js/site.js     inner pages: lightbox, contact form, footer year
assets/vendor/        three.js r186 (minified) + RoomEnvironment
assets/fonts/         EB Garamond + IBM Plex Mono (self-hosted, OFL)
assets/img/           photos (black and white), 96 EYZ emblem, og.jpg share image
tools/build.py        builds every page from shared templates
tools/pieces/         writing, stored word for word as JSON
```

To change something that appears on every page (the header, the footer, the drum labels), edit `tools/build.py`, then run:

```
python3 tools/build.py
```

## Publishing

GitHub Pages serves the site from the `gh-pages` branch. The `Publish site` workflow copies `main` to `gh-pages` on every push, so merging a pull request into `main` puts it live within a minute or two.

To use your own domain (e.g. `mawonfreedomarts.com`), add it under **Settings → Pages → Custom domain** and point your DNS at GitHub. Then update `SITE` at the top of `tools/build.py` so link previews use the new address.

## Contact form

The form sends through [FormSubmit](https://formsubmit.co), with no account and no server. **The first time someone submits it, FormSubmit emails Rothschild859@gmail.com an activation link.** Send yourself a test message and click that link. If a send ever fails, the visitor gets a link that opens a prefilled email instead.

## Adding content

- **Writing:** add a JSON file to `tools/pieces/`, copying `writing-my-wrongs.json` as a template, and run the build. The newest piece leads the Writing page and gets its own reading page.
- **Photos:** put the image in `assets/img/` (a full size and a `-sm` size), then add a `shot(...)` line to the Photos section of `tools/build.py`.
- **Music:** streaming links and the Spotify embed are in the Music section of `tools/build.py`.
- **Drums:** labels, order, size (`scale`) and pitch (`freq`) are in `DRUM_LINKS` in `tools/build.py`.

## Preview locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening the file directly won't work, because the 3D set loads as an ES module.
