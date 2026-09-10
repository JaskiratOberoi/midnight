import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { diary } from '../lib/diary';
import { reducedMotion } from '../lib/sky';

gsap.registerPlugin(DrawSVGPlugin);

type Props = { onBack: () => void };
export type DiaryHandle = { reveal: () => gsap.core.Timeline; el: HTMLElement | null };

function nightLabel(d: Date): string {
  const h = d.getHours();
  if (h >= 21) return 'the night is young';
  if (h < 4) return 'deep night';
  if (h < 6) return 'almost dawn';
  if (h < 12) return 'morning, but the night will be back';
  if (h < 18) return 'daylight, save this for later';
  return 'the night is coming';
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { time, label: nightLabel(now) };
}

type Pt = { x: number; y: number };

/**
 * The five "currently" things laid out as a constellation: each entry is a
 * star node, and a single line is drawn through them when the scene opens.
 */
const Diary = forwardRef<DiaryHandle, Props>(function Diary({ onBack }, ref) {
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<Pt[]>([]);
  const { time, label } = useClock();

  const measure = () => {
    const g = grid.current;
    if (!g) return;
    const box = g.getBoundingClientRect();
    const pts: Pt[] = [];
    g.querySelectorAll<HTMLElement>('.node').forEach((n) => {
      const r = n.getBoundingClientRect();
      pts.push({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
    });
    setPoints(pts);
  };

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (grid.current) ro.observe(grid.current);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    get el() {
      return root.current;
    },
    reveal() {
      measure();
      const reduce = reducedMotion();
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (reduce) {
        tl.set([q('.diary-head > *'), q('.entry'), q('.thread'), q('.thread-node'), q('.diary-foot')], { autoAlpha: 1 });
        return tl;
      }
      tl.fromTo(q('.diary-head > *'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0)
        .fromTo(q('.thread'), { drawSVG: '0%', autoAlpha: 1 }, { drawSVG: '100%', duration: 2.4, ease: 'power2.inOut' }, 0.5)
        .fromTo(
          q('.thread-node'),
          { autoAlpha: 0, scale: 0, transformOrigin: 'center' },
          { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.42, ease: 'back.out(3)' },
          0.5,
        )
        .fromTo(
          q('.entry'),
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 1, stagger: 0.42 },
          0.75,
        )
        .fromTo(q('.diary-foot'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.5');
      return tl;
    },
  }));

  const d = points.length ? points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') : '';

  return (
    <section className="diary" ref={root} aria-label="Things I am into">
      <div className="diary-head">
        <p className="eyebrow">✦ A little universe ✦</p>
        <h2 className="title-2">Things I'm into</h2>
        <p className="diary-intro">A few things currently occupying my little corner of the universe.</p>
        <p className="diary-clock">
          <span className="diary-time">{time}</span>
          <span className="diary-phase">{label}</span>
        </p>
      </div>

      <div className="constellation" ref={grid}>
        <svg ref={svg} className="thread-svg" aria-hidden="true">
          {d && <path className="thread" d={d} />}
          {points.map((p, i) => (
            <circle key={i} className="thread-node" cx={p.x} cy={p.y} r={22} />
          ))}
        </svg>

        {diary.map((e) => (
          <article key={e.id} className={`entry entry-${e.id}`}>
            <span className="node" aria-hidden="true">
              {e.glyph}
            </span>
            <p className="entry-label">{e.label}</p>
            <h3>{e.title}</h3>
            <p className="entry-desc">{e.description}</p>
          </article>
        ))}
      </div>

      <div className="diary-foot">
        <p className="thought">See you tomorrow night.</p>
        <button type="button" className="pill" onClick={onBack}>
          <ArrowLeft weight="bold" size={16} className="pill-icon pill-icon-left" aria-hidden="true" />
          Back to the sky
        </button>
      </div>
    </section>
  );
});

export default Diary;
