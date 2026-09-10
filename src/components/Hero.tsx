import { forwardRef } from 'react';
import { ArrowRight } from '@phosphor-icons/react';

type Props = { onEnter: () => void };

const Hero = forwardRef<HTMLElement, Props>(function Hero({ onEnter }, ref) {
  return (
    <section className="hero" ref={ref} aria-label="Midnight">
      <div className="hero-inner">
        <p className="eyebrow">✦ After dark ✦</p>
        <h1 className="title">Midnight</h1>
        <p className="subtitle">A little universe after dark.</p>
        <button type="button" className="pill pill-primary cta" onClick={onEnter}>
          Enter the night
          <ArrowRight weight="bold" size={16} className="pill-icon" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
});

export default Hero;
