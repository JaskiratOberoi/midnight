import { forwardRef, useEffect, useRef, useState } from 'react';
import { Pause, Play } from '@phosphor-icons/react';
import { nightAudio } from '../lib/audio';
import { reducedMotion } from '../lib/sky';

const BAR_COUNT = 5;

const MusicPlayer = forwardRef<HTMLDivElement>(function MusicPlayer(_, ref) {
  const [playing, setPlaying] = useState(nightAudio.playing);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => nightAudio.subscribe(setPlaying), []);

  // Drive the bars and the moon halo straight from the analyser (no React state per frame).
  useEffect(() => {
    const reduce = reducedMotion();
    let raf = 0;
    const bars = Array.from(barsRef.current?.children ?? []) as HTMLElement[];
    const root = document.documentElement;
    const smooth = new Array(BAR_COUNT).fill(0);
    let halo = 0;

    const tick = () => {
      const { bars: levels, bass } = nightAudio.levels(BAR_COUNT);
      for (let i = 0; i < bars.length; i++) {
        const target = playing ? 0.22 + levels[i] * 0.95 : 0.22;
        smooth[i] += (target - smooth[i]) * (levels[i] > smooth[i] ? 0.45 : 0.18);
        bars[i].style.transform = `scaleY(${smooth[i].toFixed(3)})`;
      }
      halo += (bass - halo) * 0.15;
      root.style.setProperty('--pulse', (reduce ? 0 : halo).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <div className="music-player" ref={ref}>
      <button
        type="button"
        className="music-button"
        onClick={() => nightAudio.toggle()}
        aria-label={playing ? 'Pause music' : 'Play music'}
        aria-pressed={playing}
      >
        {playing ? <Pause weight="fill" size={13} /> : <Play weight="fill" size={13} className="play-icon" />}
      </button>
      <div className="music-info">
        <span className={`music-note${playing ? ' is-playing' : ''}`} aria-hidden="true">
          ♫
        </span>
        <div>
          <p className="music-title">Play me</p>
          <p className="music-artist">after dark</p>
        </div>
      </div>
      <div className="music-waves" ref={barsRef} aria-hidden="true">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    </div>
  );
});

export default MusicPlayer;
