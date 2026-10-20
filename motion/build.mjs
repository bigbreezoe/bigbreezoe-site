// Render every clip with HyperFrames, then encode the web files the site loads.
// Run from the repo root: node motion/build.mjs            (all clips)
//                         node motion/build.mjs hero-loop  (one clip)
// Needs Node 22+, FFmpeg on PATH, and network for the first npx download of HyperFrames.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const media = fileURLToPath(new URL('../public/media/', import.meta.url));
const HF = 'hyperframes@0.8.179';

// poster: which frame becomes the still. 'first' for the loop, 'last' for clips that play once and hold.
// crf: H.264 / VP9 quality. The hero has a 2.5 MB budget, so it compresses harder.
const CLIPS = {
  'hero-loop': { poster: 'first', h264: 30, vp9: 40, budget: 2.5e6, webpQ: 92, avifCrf: 22 },
  'ep3-teaser': { poster: 'last', h264: 26, vp9: 36 },
  'how-buying': { poster: 'last', h264: 26, vp9: 36 },
  'gear-lanes': { poster: 'last', h264: 26, vp9: 36 },
};

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'npx', ...opts });
const ff = (args) => run('ffmpeg', ['-loglevel', 'error', '-y', ...args]);

mkdirSync(join(here, 'renders'), { recursive: true });
mkdirSync(media, { recursive: true });
const pick = process.argv.slice(2);
for (const [name, c] of Object.entries(CLIPS)) {
  if (pick.length && !pick.includes(name)) continue;
  const master = join(here, 'renders', `${name}.mp4`);
  console.log(`\n== ${name}: render`);
  run('npx', ['--yes', HF, 'render', '.', '-c', `compositions/${name}.html`, '-o', `renders/${name}.mp4`, '-q', 'delivery', '--quiet'], { cwd: here });

  console.log(`== ${name}: encode`);
  const scale = 'scale=1280:720:flags=lanczos,format=yuv420p';
  ff(['-i', master, '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(c.h264), '-profile:v', 'high', '-movflags', '+faststart', '-an', join(media, `${name}.mp4`)]);
  ff(['-i', master, '-vf', scale, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(c.vp9), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', join(media, `${name}.webm`)]);

  const seek = c.poster === 'first' ? ['-ss', '0'] : ['-sseof', '-0.1'];
  ff([...seek, '-i', master, '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libwebp', '-quality', String(c.webpQ || 80), join(media, `${name}.webp`)]);
  ff([...seek, '-i', master, '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', String(c.avifCrf || 32), join(media, `${name}.avif`)]);

  for (const ext of ['mp4', 'webm', 'webp', 'avif']) {
    const size = statSync(join(media, `${name}.${ext}`)).size;
    console.log(`   ${name}.${ext}  ${(size / 1024).toFixed(0)} KB`);
    if (c.budget && (ext === 'mp4' || ext === 'webm') && size > c.budget) throw new Error(`${name}.${ext} is over its ${c.budget / 1e6} MB budget`);
  }
}
console.log('\nDone. Files are in public/media/.');
