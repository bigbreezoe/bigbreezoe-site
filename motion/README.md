# Motion clips

The site's rendered motion. Each clip is a HyperFrames composition (HTML plus GSAP, rendered to video in headless Chrome). Typography and information design only: no stock footage, no CGI filler, and no number that was not measured.

| Clip | File | Length | Where it shows | Poster |
|---|---|---|---|---|
| Hero loop | `compositions/hero-loop.html` | 10 s, seamless | Home hero, behind the headline | first frame |
| Episode 3 teaser | `compositions/ep3-teaser.html` | 6 s, plays once | Home, Episode 3 card | last frame |
| How buying works | `compositions/how-buying.html` | 8 s, plays once | Home, Shop section | last frame |
| Free, best value, premium | `compositions/gear-lanes.html` | 8 s, plays once | Home, Gear section | last frame |

## Re-render

Needs Node 22+ and FFmpeg on PATH. From the repo root:

```bash
node motion/build.mjs
```

Or one clip: `node motion/build.mjs ep3-teaser`.

The script renders a 1920x1080 master into `motion/renders/` (ignored by git), then writes what the site loads into `public/media/`:

- `<name>.mp4` (H.264, 1280x720, no audio, fast start)
- `<name>.webm` (VP9, 1280x720, no audio)
- `<name>.webp` and `<name>.avif` (the poster)

The hero has a 2.5 MB budget and the script fails if it goes over. The CLI version is pinned in `build.mjs` (`hyperframes@0.8.179`). While it renders, the CLI may print "No index.html file found". That comes from a side check, and the render itself still finishes.

## Edit a clip

Open the composition HTML. Every timed change is one line on the GSAP timeline at the bottom, positioned in seconds. The brand fonts in `fonts/` are copies of the site's self-hosted files. To preview in the HyperFrames studio, run `npx hyperframes@0.8.179 preview` from this folder.

After a re-render, run `npm run layout` so the asset version stamps stay current, then `npm run check`.

## On the site

`public/assets/bb.js` attaches the video sources only when a clip comes near the screen, so nothing below the hero downloads at page load. With reduced motion turned on, or on Save-Data, no video loads at all and the poster shows instead. The hero is the only clip that loops.
