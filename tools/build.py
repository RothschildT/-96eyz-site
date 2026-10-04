#!/usr/bin/env python3
"""Builds every HTML page from shared templates.

    python3 tools/build.py

The output is plain static HTML, so you can also edit pages by hand. If you do,
make the same change here too, or the next build will overwrite it.

Writing pieces live in tools/pieces/*.json and are kept word for word.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://rothschildt.github.io/-96eyz-site/'  # used for share previews; change if you add a custom domain

NAV = [('about', 'About'), ('music', 'Music'), ('writing', 'Writing'), ('photos', 'Photos'), ('contact', 'Contact')]

SPOTIFY = 'https://open.spotify.com/artist/24g9kNkE5XKPFGsnenP1is'
APPLE = 'https://music.apple.com/us/album/in-the-eye-see-you/1755154870'
YOUTUBE = 'https://www.youtube.com/watch?v=ll3WojQJtV4&list=OLAK5uy_mfuJdqVvhNlIFfjC0E_tuEhltdLwyFClU'
SOUNDCLOUD = 'https://soundcloud.com/user-230254561'
LINKTREE = 'https://linktr.ee/RothschildT'
INSTAGRAM = 'https://www.instagram.com/rothschildd_/'
INSTAGRAM_PHOTO = 'https://www.instagram.com/capturedbyrothschild/'  # photography account
X = 'https://x.com/RothschildSFG'
SUBSTACK = 'https://rothschild2000.substack.com'
EMAIL = 'Rothschild859@gmail.com'
# the photo the old 96 EYZ page used (Google Drive). Falls back to a local photo if Drive refuses it.
DRIVE_PHOTO = 'https://lh3.googleusercontent.com/d/1bSPGsGQAB3WYDalVnW4FaZA730SH4Ft0=w1200'

# Roth$child's own words from the original 96 EYZ page. Keep verbatim.
BIO = ('Hailing from the 509 (Haiti) and the 305 (Miami), Roth$child\'s (born Rothschild J. Toussaint) creates worlds '
       'with lyrical brevity and dynamics instrumentalism. A rap aficionado and historian, Roth$child sees his talent as '
       'omnipresent in the genre. Fixated on being versatile, Roth$child infuses a plethora of genres in his music and '
       'allows mind to wander and create worlds within sonic measures.')
TAGLINE = 'Artist · Producer · Storyteller'

PIECES = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((ROOT / 'tools' / 'pieces').glob('*.json'))]
PIECES.sort(key=lambda p: p['date'], reverse=True)


def seal(uid, cls='seal', decorative=False):
    label = 'aria-hidden="true"' if decorative else 'role="img" aria-label="Mawon Freedom Arts seal"'
    return (
        f'<svg class="{cls}" viewBox="0 0 200 200" {label}>'
        f'<defs><path id="{uid}" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/></defs>'
        '<circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width="1.5"/>'
        '<circle cx="100" cy="100" r="52" fill="none" stroke="currentColor" stroke-width="1"/>'
        '<circle cx="100" cy="100" r="22" fill="currentColor"/>'
        '<text font-family="IBM Plex Mono, monospace" font-size="12.5" fill="currentColor">'
        f'<textPath href="#{uid}" textLength="446" lengthAdjust="spacing">MAWON · FREEDOM · ARTS · 509 · 305 · </textPath>'
        '</text></svg>'
    )


WORDMARK = ('<span class="wm-a">MAW<span class="o" aria-hidden="true"></span>N</span>\n'
            '      <span class="wm-b">freedom arts</span>')


def head(title, desc, p, path, theme='#0b0b0b', extra=''):
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{html.escape(desc)}">
  <meta name="theme-color" content="{theme}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{html.escape(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{SITE}{path}">
  <meta property="og:image" content="{SITE}assets/img/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="{p}assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="{p}assets/fonts/eb-garamond.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{p}assets/css/site.css">{extra}
</head>'''


def page(slug, title, desc, body, body_class='', depth=1, path=None):
    p = '../' * depth
    current = ' aria-current="page"'
    nav = '\n      '.join(f'<a href="{p}{s}/"{current if s == slug else ""}>{label}</a>' for s, label in NAV)
    paper = 'paper' in body_class
    cls = f' class="{body_class}"' if body_class else ''
    full_title = f'{title} · Mawon Freedom Arts'
    return head(full_title, desc, p, path or f'{slug}/', '#f2f0eb' if paper else '#0b0b0b') + f'''
<body{cls}>
  <a class="skip" href="#main">Skip to content</a>

  <header class="site-head">
    <a class="wordmark" href="{p}" aria-label="Mawon Freedom Arts, home">
      {WORDMARK}
    </a>
    <nav class="site-nav" aria-label="Main">
      {nav}
    </nav>
  </header>

  <main id="main" class="page enter">
{body}
  </main>

  <footer class="site-foot label">
    <a class="foot-seal" href="{p}" aria-label="Mawon Freedom Arts, home">{seal('foot-seal-path', 'seal', decorative=True)}</a>
    <span>Mawon Freedom Arts · home of 96 EYZ · 509 / 305</span>
    <span class="socials">
      <span class="pair-links"><a href="{INSTAGRAM}" target="_blank" rel="noopener">Instagram</a><span class="slash" aria-hidden="true">/</span><a href="{INSTAGRAM_PHOTO}" target="_blank" rel="noopener">Captured by Rothschild</a></span>
      <a href="{X}" target="_blank" rel="noopener">X</a>
      <a href="{LINKTREE}" target="_blank" rel="noopener">Linktree</a>
      <a href="{SUBSTACK}" target="_blank" rel="noopener">Substack</a>
    </span>
    <span>© <span data-year>2026</span></span>
  </footer>

  <script src="{p}assets/js/site.js" defer></script>
</body>
</html>
'''


def title_block(en, kr, n):
    return f'''    <div class="page-title">
      <h1>{en} <i>{kr}</i></h1>
      <span class="label">0{n} / 05</span>
    </div>'''


# ---------------------------------------------------------------- home (two versions)

# left to right on the stage; Music sits in the middle as the big tumba
DRUM_LINKS = [
    ('about', 'About', 'istwa', 0.95, 294, ''),
    ('writing', 'Writing', 'ekri', 1.0, 262, ' data-paper'),
    ('music', 'Music', 'mizik', 1.14, 196, ' data-badge="emblem"'),
    ('photos', 'Photos', 'foto', 1.0, 247, ''),
    ('contact', 'Contact', 'pale', 0.95, 330, ''),
]


def home(p=''):
    links = '\n    '.join(
        f'<a href="{p}{s}/" data-drum="{i}" data-scale="{scale}" data-freq="{freq}"{extra}>'
        f'<span class="dl-en">{en}</span> <span class="dl-kr">{kr}</span></a>'
        for i, (s, en, kr, scale, freq, extra) in enumerate(DRUM_LINKS)
    )
    desc = ('Mawon Freedom Arts is a multimedia house for sound, word and image, founded by Roth$child. '
            'Home of 96 EYZ.')
    return head('Mawon Freedom Arts', desc, p, '', '#070707',
                f'\n  <link rel="modulepreload" href="{p}assets/vendor/three.min.js">') + f'''
<body class="home">
  <a class="skip" href="#drums">Skip to the menu</a>

  <header class="home-head">
    <div>
      <a class="wordmark" href="{p or './'}" aria-label="Mawon Freedom Arts, home">
      {WORDMARK}
      </a>
      <p class="verbs label"><span>drum</span><span>write</span><span>record</span><span>shoot</span><span>gather</span></p>
    </div>
    <div class="head-right label">
      <a class="eyz-link" href="{p}music/"><img class="emblem-sm" src="{p}assets/img/96eyz-emblem.png" alt="" width="22" height="22">96 EYZ</a>
      <button class="sound-toggle label" type="button" aria-pressed="true" aria-label="Sound" hidden>
        <span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="txt">Sound on</span>
      </button>
    </div>
  </header>

  <p class="masthead" aria-hidden="true">Mawon</p>

  <canvas id="stage" aria-hidden="true"></canvas>

  <!-- Each link is a drum, left to right. The 3D set reads href, size (data-scale) and pitch (data-freq) from here. -->
  <nav id="drums" class="drum-nav" aria-label="Main">
    {links}
  </nav>

  <footer class="home-foot">
    <p class="def"><b>mawon</b> <i>(Kreyòl)</i> means maroon: people who freed themselves and built their own world in the hills. This is a house for sound, word and image.</p>
    <p class="hint label"><span class="pick">Pick a drum.</span> <span class="keys">Or play them <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><kbd>G</kbd></span></p>
  </footer>

  <div class="curtain" aria-hidden="true"></div>

  <script type="importmap">
    {{ "imports": {{ "three": "{p or './'}assets/vendor/three.min.js" }} }}
  </script>
  <script type="module" src="{p}assets/js/stage.js"></script>
</body>
</html>
'''


# ---------------------------------------------------------------- about

ABOUT = title_block('About', 'istwa', 1) + f'''

    <section class="block split">
      <figure class="sticky">
        <img src="../assets/img/portrait.jpg" srcset="../assets/img/portrait-sm.jpg 800w, ../assets/img/portrait.jpg 1140w"
             sizes="(max-width: 860px) 100vw, 40vw" width="1140" height="1500"
             alt="Roth$child in a worn canvas work jacket, locs falling past the shoulders, against pale clapboard siding.">
      </figure>
      <div>
        <p class="lede">Rothschild's life is defined by art in all its forms: music, writing and photography. Mawon Freedom Arts is home base for all three.</p>
        <p class="label muted tagline">{TAGLINE}</p>
        <div class="prose">
          <p>{BIO}</p>
        </div>

        <div class="rows" style="margin-top: 48px">
          <div class="row">
            <span class="label">The house</span>
            <div><p>Mawon Freedom Arts is a multimedia house founded by Roth$child. Music, writing and photography sit side by side here, like drums in the same set.</p></div>
          </div>
          <div class="row">
            <span class="label">96 EYZ</span>
            <div><p>The music arm of Mawon Freedom Arts. <a class="arrow-link" href="../music/">Listen →</a></p></div>
          </div>
          <div class="row">
            <span class="label">From</span>
            <div><p>Haiti (the 509) and Miami (the 305).</p></div>
          </div>
          <div class="row">
            <span class="label">Practice</span>
            <div><p>Music · Writing · Photography</p></div>
          </div>
        </div>
      </div>
    </section>

    <figure class="bleed">
      <img src="../assets/img/congas.jpg" srcset="../assets/img/congas-sm.jpg 800w, ../assets/img/congas.jpg 1600w"
           sizes="100vw" width="1600" height="1066" loading="lazy"
           alt="Roth$child at a row of three congas, eyes closed, hands blurred mid-stroke.">
    </figure>

    <section class="block split">
      <div class="why-mark">
        <span class="label muted">Why mawon</span>
        <figure>
          <img src="../assets/img/negmawon-visit-sm.jpg" srcset="../assets/img/negmawon-visit-sm.jpg 800w, ../assets/img/negmawon-visit.jpg 1500w"
               sizes="(max-width: 860px) 100vw, 40vw" width="800" height="1067" loading="lazy"
               alt="Roth$child standing in front of the Nèg Mawon statue in Port-au-Prince under a clear sky.">
          <figcaption class="label">Roth$child at Nèg Mawon, Port-au-Prince. Christmas Day, 2019.</figcaption>
        </figure>
      </div>
      <div>
        <p class="lede">In Haitian Kreyòl, <i>mawon</i> means maroon. The maroons were people who freed themselves from slavery and built their own communities in the mountains.</p>
        <div class="prose">
          <p>In Port-au-Prince there is a statue called Nèg Mawon, the Unknown Maroon. He blows a conch shell, a broken chain at his ankle, calling people to freedom. Mawon Freedom Arts takes its name from that call: make the work on your own terms, and break every chain.</p>
        </div>
        {seal('about-seal-path', 'seal seal-end')}
      </div>
    </section>'''


# ---------------------------------------------------------------- music

MUSIC = title_block('Music', 'mizik', 2) + f'''

    <section class="block eyz">
      <img class="emblem" src="../assets/img/96eyz-emblem.png" width="425" height="425" alt="The 96 EYZ emblem: a 96 monogram inside a ring, like a drumhead.">
      <div>
        <p class="eyz-mark">96 EYZ</p>
        <p class="lede">The music arm of Mawon Freedom Arts. Records by Roth$child.</p>
      </div>
    </section>

    <section class="release">
      <figure class="release-art">
        <img src="{DRIVE_PHOTO}" alt="Roth$child, 96 EYZ." width="960" height="1200" loading="lazy"
             referrerpolicy="no-referrer" data-fallback="../assets/img/kit.jpg">
      </figure>
      <div>
        <span class="label muted">Latest release</span>
        <h2>In The Eye See You</h2>
        <ul class="listen">
          <li><a href="{SPOTIFY}" target="_blank" rel="noopener">Spotify <span class="label">Listen ↗</span></a></li>
          <li><a href="{APPLE}" target="_blank" rel="noopener">Apple Music <span class="label">Listen ↗</span></a></li>
          <li><a href="{YOUTUBE}" target="_blank" rel="noopener">YouTube <span class="label">Watch ↗</span></a></li>
          <li><a href="{SOUNDCLOUD}" target="_blank" rel="noopener">SoundCloud <span class="label">Listen ↗</span></a></li>
        </ul>
      </div>
    </section>

    <section class="block origins">
      <div>
        <span class="label muted">From the start</span>
        <p class="lede">It started at a toy piano and never stopped.</p>
      </div>
      <div class="pair">
        <figure>
          <img src="../assets/img/first-keys-sm.jpg" srcset="../assets/img/first-keys-sm.jpg 800w, ../assets/img/first-keys.jpg 1333w"
               sizes="(max-width: 640px) 100vw, 420px" width="800" height="1200" loading="lazy"
               alt="Roth$child as a small child, standing at a toy grand piano with both hands on the keys.">
          <figcaption class="label">First keys</figcaption>
        </figure>
        <figure>
          <img src="../assets/img/drum-room-sm.jpg" srcset="../assets/img/drum-room-sm.jpg 800w, ../assets/img/drum-room.jpg 1500w"
               sizes="(max-width: 640px) 100vw, 420px" width="800" height="1067" loading="lazy"
               alt="Roth$child with arms open in a room packed with congas, djembes and drum kits.">
          <figcaption class="label">A room full of drums</figcaption>
        </figure>
      </div>
    </section>

    <section class="block">
      <iframe class="embed" title="Roth$child on Spotify" loading="lazy"
              src="https://open.spotify.com/embed/artist/24g9kNkE5XKPFGsnenP1is?utm_source=generator&amp;theme=0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
      <p class="label muted" style="margin-top: 20px">Everything else: <a class="arrow-link" href="{LINKTREE}" target="_blank" rel="noopener">linktr.ee/RothschildT</a></p>
    </section>'''


# ---------------------------------------------------------------- writing

def polaroid(p, cls='polaroid', caption='On the beach, writing', eager=False):
    lazy = '' if eager else ' loading="lazy"'
    return f'''<figure class="{cls}">
        <img src="{p}assets/img/beach-sm.jpg" srcset="{p}assets/img/beach-sm.jpg 700w, {p}assets/img/beach.jpg 1200w"
             sizes="(max-width: 860px) 90vw, 440px" width="700" height="992"{lazy}
             alt="Polaroid of Roth$child on the beach, sitting in front of a small tent and writing in a notebook.">
        <figcaption>{caption}</figcaption>
      </figure>'''


def writing_index():
    lead = PIECES[0]
    n = len(PIECES)
    return title_block('Writing', 'ekri', 3) + f'''

    <section class="block">
      <p class="lede">Essays, verses, liner notes and dispatches from inside the house.</p>
    </section>

    <section class="feature">
      {polaroid('../', eager=True)}
      <div class="feature-text">
        <span class="label muted">{n:03d} · {lead['date_label']}</span>
        <h2><a href="{lead['slug']}/">{lead['title']}</a></h2>
        <p class="dek">{html.escape(lead['subtitle'])}</p>
        <div class="feature-links">
          <a class="btn" href="{lead['slug']}/">Read it here →</a>
          <a class="arrow-link label" href="{lead['substack_url']}" target="_blank" rel="noopener">On Substack ↗</a>
        </div>
      </div>
    </section>

    <section class="block subscribe">
      <p>New pieces, straight to your inbox.</p>
      <a class="btn" href="{SUBSTACK}/subscribe" target="_blank" rel="noopener">Subscribe on Substack ↗</a>
    </section>'''


def reading(piece):
    paras = []
    for i, text in enumerate(piece['paragraphs'], 1):
        t = html.escape(text, quote=False)
        for b in piece.get('bold', []):
            # bold only the word the post bolds, inside the phrase that locates it
            t = t.replace(b, b.replace('InI', '<strong>InI</strong>'))
        cls = ' class="signoff"' if text.startswith(('Thank you,', 'Rothschild Johnny')) else ''
        paras.append(f'      <p{cls}>{t}</p>')
        if i == piece.get('photo_after_paragraph'):
            paras.append('      ' + polaroid('../../', 'polaroid inset', caption=''))
    body = '\n'.join(paras)
    return f'''    <article class="reading">
      <a class="label back" href="../">← Writing</a>
      <header class="read-head">
        <p class="label muted">{piece['date_label']} · {piece['author']}</p>
        <h1>{piece['title']}</h1>
        <p class="dek">{html.escape(piece['subtitle'])}</p>
      </header>
      <div class="read-body">
{body}
      </div>
      <footer class="read-foot label">
        <span>First published on Substack, {piece['date_label']}.</span>
        <a class="arrow-link" href="{piece['substack_url']}" target="_blank" rel="noopener">Read it there ↗</a>
        <a class="arrow-link" href="{SUBSTACK}/subscribe" target="_blank" rel="noopener">Subscribe ↗</a>
      </footer>
    </article>'''


# ---------------------------------------------------------------- photos

def shot(name, w, h, caption, alt, cls='shot', sizes='(max-width: 640px) 100vw, 620px', lazy=True, pos=''):
    big = {'congas': 1600, 'portrait': 1140, 'kit': 1600, 'beach': 1200, 'negmawon': 1600}[name]
    style = f' style="object-position: {pos}"' if pos else ''  # where to crop when the slot is narrower than the photo
    sm = 700 if name == 'beach' else 800
    lz = ' loading="lazy"' if lazy else ''
    return f'''        <figure class="{cls}">
          <button type="button" data-full="../assets/img/{name}.jpg" aria-label="Open photo: {caption.split(' · ')[-1].lower()}">
            <img src="../assets/img/{name}-sm.jpg" srcset="../assets/img/{name}-sm.jpg {sm}w, ../assets/img/{name}.jpg {big}w"
                 sizes="{sizes}" width="{w}" height="{h}"{lz}{style}
                 alt="{alt}">
          </button>
          <figcaption class="label">{caption}</figcaption>
        </figure>'''


PHOTOS = title_block('Photos', 'foto', 4) + f'''

    <section class="block">
      <div class="shots">
{shot('congas', 800, 533, '01 · At the congas', 'Roth$child at a row of three congas, eyes closed, hands blurred mid-stroke.', 'shot wide', '(max-width: 1240px) 100vw, 1240px', lazy=False)}
{shot('kit', 800, 1067, '02 · Behind the kit', 'Roth$child seated behind a drum kit with congas and chimes in the foreground.', 'shot third', '(max-width: 640px) 100vw, 400px')}
{shot('negmawon', 800, 826, '03 · Nèg Mawon, Port-au-Prince, 2019', 'The Nèg Mawon statue in Port-au-Prince: a kneeling figure blowing a conch shell, one leg stretched out with a broken shackle at the ankle.', 'shot third', '(max-width: 640px) 100vw, 400px', pos='72% 50%')}
{shot('beach', 700, 992, '04 · On the beach, writing', 'Polaroid of Roth$child on the beach, sitting in front of a small tent and writing in a notebook.', 'shot third', '(max-width: 640px) 100vw, 400px')}
      </div>
      <p class="label muted more-photos">More photos on Instagram: <a class="arrow-link" href="{INSTAGRAM_PHOTO}" target="_blank" rel="noopener">@capturedbyrothschild ↗</a></p>
    </section>

    <dialog class="lightbox" aria-label="Photo">
      <button class="close label" type="button">Close ✕</button>
      <img alt="">
      <p class="cap label"></p>
    </dialog>'''


# ---------------------------------------------------------------- contact

CONTACT = title_block('Contact', 'pale', 5) + f'''

    <section class="block split">
      <div>
        <p class="lede">Bookings, collaborations, licensing, press, or just something to say. Talk to me.</p>
        <div class="rows direct">
          <div class="row"><span class="label">Email</span><div><a href="mailto:{EMAIL}">{EMAIL}</a></div></div>
          <div class="row"><span class="label">Instagram</span><div><a href="{INSTAGRAM}" target="_blank" rel="noopener">@rothschildd_</a><span class="slash" aria-hidden="true">/</span><a href="{INSTAGRAM_PHOTO}" target="_blank" rel="noopener">@capturedbyrothschild</a></div></div>
          <div class="row"><span class="label">X</span><div><a href="{X}" target="_blank" rel="noopener">@RothschildSFG</a></div></div>
          <div class="row"><span class="label">Substack</span><div><a href="{SUBSTACK}" target="_blank" rel="noopener">rothschild2000</a></div></div>
        </div>
      </div>

      <form class="form" id="inquiry" action="https://formsubmit.co/{EMAIL}" method="POST" data-email="{EMAIL}">
        <input type="hidden" name="_subject" value="New inquiry from mawonfreedomarts">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_captcha" value="false">
        <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>

        <fieldset>
          <legend class="label">What's it about?</legend>
          <div class="chips">
            <label><input type="radio" name="topic" value="Booking" checked><span>Booking</span></label>
            <label><input type="radio" name="topic" value="Collaboration"><span>Collab</span></label>
            <label><input type="radio" name="topic" value="Licensing"><span>Licensing</span></label>
            <label><input type="radio" name="topic" value="Press"><span>Press</span></label>
            <label><input type="radio" name="topic" value="Writing"><span>Writing</span></label>
            <label><input type="radio" name="topic" value="Other"><span>Other</span></label>
          </div>
        </fieldset>

        <label class="field">
          <span class="label">Your name</span>
          <input type="text" name="name" autocomplete="name" required placeholder="First and last">
        </label>
        <label class="field">
          <span class="label">Your email</span>
          <input type="email" name="email" autocomplete="email" required placeholder="you@domain.com">
        </label>
        <label class="field">
          <span class="label">Message</span>
          <textarea name="message" required placeholder="Dates, places, ideas. Whatever helps."></textarea>
        </label>

        <div class="form-foot">
          <button class="btn" type="submit">Send it →</button>
          <p class="status label" role="status" aria-live="polite"></p>
        </div>
      </form>
    </section>'''


# ---------------------------------------------------------------- brand

BRAND = f'''    <div class="page-title">
      <h1>Marks <i>mak</i></h1>
      <span class="label">Brand sheet</span>
    </div>

    <section class="block">
      <p class="lede">The marks in use: the wordmark and seal for Mawon Freedom Arts, and the emblem for 96 EYZ.</p>
    </section>

    <section class="marks">
      <figure class="mark mark-wide">
        <div class="mark-art"><span class="wordmark wm-xl">{WORDMARK}</span></div>
        <figcaption class="label"><b>01 · Wordmark.</b> The O is a drumhead seen from above. Capitals for the name, italics for the promise.</figcaption>
      </figure>

      <figure class="mark">
        <div class="mark-art">{seal('brand-seal-path')}</div>
        <figcaption class="label"><b>02 · Seal.</b> The maker's stamp on every drumhead. Use it for avatars, stickers and merch.</figcaption>
      </figure>

      <figure class="mark">
        <div class="mark-art"><img class="emblem" src="../assets/img/96eyz-emblem.png" width="425" height="425" alt="The 96 EYZ emblem."></div>
        <figcaption class="label"><b>03 · 96 EYZ emblem.</b> For the music: covers, the Music page, the center drum.</figcaption>
      </figure>

      <figure class="mark">
        <div class="mark-art lockups">
          <p><span class="eyz">96 EYZ</span></p>
          <p class="label muted">a Mawon Freedom Arts imprint</p>
        </div>
        <figcaption class="label"><b>04 · Credit line.</b> How the music arm signs its work.</figcaption>
      </figure>
    </section>'''


# ---------------------------------------------------------------- write it all

def write(rel, text):
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding='utf-8')
    print('wrote', rel)


write('index.html', home())

PAGES = [
    ('about', 'About', 'Roth$child (born Rothschild J. Toussaint) and the story behind Mawon Freedom Arts.', ABOUT, ''),
    ('music', 'Music', '96 EYZ, the music arm of Mawon Freedom Arts. Records by Roth$child.', MUSIC, ''),
    ('writing', 'Writing', 'Essays, verses, liner notes and dispatches from Mawon Freedom Arts.', writing_index(), 'paper'),
    ('photos', 'Photos', 'Photographs from Mawon Freedom Arts.', PHOTOS, ''),
    ('brand', 'Marks', 'The Mawon Freedom Arts wordmark and seal, and the 96 EYZ emblem.', BRAND, ''),
    ('contact', 'Contact', 'Bookings, collaborations, licensing and press for Mawon Freedom Arts and 96 EYZ.', CONTACT, ''),
]
for slug, title, desc, body, cls in PAGES:
    write(f'{slug}/index.html', page(slug, title, desc, body, cls))

for piece in PIECES:
    canonical = f'\n  <link rel="canonical" href="{piece["substack_url"]}">'
    text = page('writing', piece['title'].rstrip('.'), piece['subtitle'], reading(piece), 'paper', depth=2,
                path=f'writing/{piece["slug"]}/')
    text = text.replace('\n</head>', canonical + '\n</head>', 1)
    write(f'writing/{piece["slug"]}/index.html', text)
