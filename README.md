# Mawon Freedom Arts

The website for Mawon Freedom Arts, a multimedia house founded by Roth$child. 96 EYZ is its music arm.

The home page is a set of five congas. Click a drumhead to go through it. You can also play the drums with the **A S D F G** keys.

Plain static HTML, CSS and JS. No build step.

```
index.html            home: the 3D conga set
about/ music/ writing/ photos/ contact/
brand/                brand sheet: ways to write the name (not linked in the nav)
404.html              "Wrong drum."
assets/css/site.css   all styles
assets/js/stage.js    the 3D set: drums, sound, ripple, dive transition
assets/js/site.js     inner pages: lightbox, contact form, footer year
assets/vendor/        three.js r186 (minified) + RoomEnvironment
assets/fonts/         EB Garamond + IBM Plex Mono (self-hosted, OFL)
assets/img/           photos (black and white), og.jpg share image
```

## Put it online (GitHub Pages)

1. Merge this branch into `main`.
2. In the repo, go to **Settings → Pages → Build and deployment**. Set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. About a minute later the site is live at `https://rothschildt.github.io/-96eyz-site/`.

To use your own domain (e.g. `mawonfreedomarts.com`), add it under **Settings → Pages → Custom domain** and point your DNS at GitHub. All paths are relative, so the site works either way.

## Contact form

The form sends through [FormSubmit](https://formsubmit.co), with no account and no server. **The first time someone submits it, FormSubmit emails Rothschild859@gmail.com an activation link.** Send yourself a test message right after going live and click that link. If a send fails, the visitor gets a link that opens a prefilled email instead.

## Adding content

- **Writing:** `writing/index.html` has a commented template for an entry. Copy it, fill it in, and delete the "first pieces are in the edit" block.
- **Photos:** put the image in `assets/img/`, then copy a `<figure class="shot">` block in `photos/index.html`. Add `wide` to the class for a full-width photo.
- **Music:** streaming links and the Spotify embed are in `music/index.html`.
- **Drums:** labels and links live in the `<nav id="drums">` list in `index.html`. Size and pitch of each drum are in `DRUMS` at the top of `assets/js/stage.js`.

## Preview locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening the file directly won't work, because the 3D set loads as an ES module.
