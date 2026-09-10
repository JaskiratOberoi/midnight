import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import Starfield from './components/Starfield';
import Moon from './components/Moon';
import Hero from './components/Hero';
import Diary, { type DiaryHandle } from './components/Diary';
import MusicPlayer from './components/MusicPlayer';
import { nightAudio } from './lib/audio';
import { sky, reducedMotion } from './lib/sky';

gsap.registerPlugin(useGSAP, SplitText);

if (import.meta.env.DEV) {
  // handy for poking timelines from devtools
  (window as unknown as { gsap: typeof gsap }).gsap = gsap;
}

type Scene = 'sky' | 'night';

export default function App() {
  const root = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const diaryRef = useRef<DiaryHandle>(null);
  const busy = useRef(false);
  const [scene, setScene] = useState<Scene>('sky');

  // ---- Intro choreography -------------------------------------------------
  const { contextSafe } = useGSAP(
    () => {
      const reduce = reducedMotion();
      const q = gsap.utils.selector(root);
      const hero = heroRef.current!;
      const moon = moonRef.current!;
      const player = playerRef.current!;
      const title = hero.querySelector<HTMLElement>('.title')!;

      if (reduce) {
        sky.dim = 1;
        gsap.set([hero, moon, player], { autoAlpha: 1 });
        return;
      }

      // Nothing is visible until the fonts are in and the title is split.
      gsap.set([q('.eyebrow'), q('.subtitle'), q('.cta'), player, title], { autoAlpha: 0 });
      gsap.set(moon, { autoAlpha: 0 });

      const start = contextSafe(() => {
        const split = SplitText.create(title, { type: 'chars', mask: 'chars', charsClass: 'char' });
        gsap.set(title, { autoAlpha: 1 });

        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .to(sky, { dim: 1, duration: 2.6, ease: 'power2.out' }, 0)
          .fromTo(moon, { autoAlpha: 0, yPercent: 35, scale: 0.86 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 2.4 }, 0.15)
          .fromTo(q('.eyebrow'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.9)
          .from(split.chars, { yPercent: 115, duration: 1.15, stagger: 0.05, ease: 'power4.out' }, 1.15)
          .fromTo(q('.subtitle'), { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.8)
          .fromTo(q('.cta'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 2.1)
          .fromTo(player, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 2.3);

        // idle float, forever
        gsap.to(q('.moon'), { y: 14, duration: 5.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      });

      document.fonts.ready.then(start);

      // pointer parallax: moon, hero and (via sky) the stars
      const moonX = gsap.quickTo(q('.moon-orbit'), 'x', { duration: 1.4, ease: 'power3.out' });
      const moonY = gsap.quickTo(q('.moon-orbit'), 'y', { duration: 1.4, ease: 'power3.out' });
      const heroX = gsap.quickTo(q('.hero-inner'), 'x', { duration: 1.2, ease: 'power3.out' });
      const heroY = gsap.quickTo(q('.hero-inner'), 'y', { duration: 1.2, ease: 'power3.out' });
      const onMove = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        sky.px = nx;
        sky.py = ny;
        moonX(nx * 22);
        moonY(ny * 12);
        heroX(nx * 9);
        heroY(ny * 9);
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    },
    { scope: root },
  );

  // Try to start the song right away (browsers usually wait for a gesture; the CTA covers that).
  useEffect(() => {
    void nightAudio.play();
  }, []);

  // Once the night scene is mounted, draw the constellation.
  useLayoutEffect(() => {
    if (scene !== 'night') return;
    const tl = diaryRef.current?.reveal();
    tl?.eventCallback('onComplete', () => {
      busy.current = false;
    });
    return () => {
      tl?.kill();
    };
  }, [scene]);

  // ---- Scene transitions --------------------------------------------------
  const enterNight = contextSafe(() => {
    if (busy.current || scene !== 'sky') return;
    busy.current = true;
    void nightAudio.play();
    const reduce = reducedMotion();
    const hero = heroRef.current!;
    const moon = moonRef.current!;

    const tl = gsap.timeline({
      onComplete: () => {
        setScene('night');
        window.scrollTo({ top: 0 });
      },
    });

    if (reduce) {
      tl.set(hero, { autoAlpha: 0 }).set(moon, { opacity: 0.15, x: 110, y: -130 });
      sky.dim = 0.55;
      return;
    }

    tl.to(hero, { autoAlpha: 0, y: -60, duration: 0.85, ease: 'power3.in' }, 0)
      .to(sky, { warp: 1, duration: 1.1, ease: 'power2.in' }, 0)
      .to(sky, { warp: 0, duration: 1.3, ease: 'power3.out' }, 1.1)
      .to(sky, { dim: 0.55, duration: 1.2, ease: 'power2.inOut' }, 0.6)
      .to(moon, { scale: 1.15, opacity: 0.15, x: 110, y: -130, duration: 1.5, ease: 'power2.inOut' }, 0.25);
  });

  const backToSky = contextSafe(() => {
    if (busy.current || scene !== 'night') return;
    busy.current = true;
    const reduce = reducedMotion();
    const diaryEl = diaryRef.current?.el;
    if (!diaryEl) return;
    const hero = heroRef.current!;
    const moon = moonRef.current!;

    const tl = gsap.timeline({
      onComplete: () => {
        setScene('sky');
        window.scrollTo({ top: 0 });
        gsap.fromTo(hero, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 1.1, ease: 'power3.out', onComplete: () => (busy.current = false) });
      },
    });

    if (reduce) {
      tl.set(diaryEl, { autoAlpha: 0 }).set(moon, { opacity: 1, x: 0, y: 0 });
      sky.dim = 1;
      return;
    }

    tl.to(diaryEl, { autoAlpha: 0, y: 30, duration: 0.7, ease: 'power3.in' }, 0)
      .to(moon, { scale: 1, opacity: 1, x: 0, y: 0, duration: 1.4, ease: 'power2.inOut' }, 0.2)
      .to(sky, { dim: 1, duration: 1.2, ease: 'power2.inOut' }, 0.2);
  });

  return (
    <main className={`midnight scene-${scene}`} ref={root}>
      <div className="nebula" aria-hidden="true" />
      <Starfield />
      <Moon ref={moonRef} />
      <Hero ref={heroRef} onEnter={enterNight} />
      <div className="night" hidden={scene !== 'night'}>
        <Diary ref={diaryRef} onBack={backToSky} />
      </div>
      <MusicPlayer ref={playerRef} />
    </main>
  );
}
