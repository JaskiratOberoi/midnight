# Midnight

A little universe after dark. A single-page night sky built with Vite, React 19 and GSAP.

## What is in it

- Canvas starfield with depth parallax, twinkle, meteors and a warp streak used by the scene transition.
- Moonrise intro, split-character title reveal, and a "Enter the night" transition into the diary.
- The diary is a constellation: five panels laid out as stars with one thread drawn through them.
- Music player with a Web Audio analyser. The bars, the moon halo and the star shimmer all follow the track.
- Respects `prefers-reduced-motion` and `prefers-reduced-transparency`.

## Run

```bash
npm install
npm run dev
```

`npm run build` writes a static site to `dist/`, ready for Vercel or any static host.

The song lives at `public/music/midnight-song.mp3`. Browsers usually block audio until the first interaction, so the "Enter the night" button also starts the music.
