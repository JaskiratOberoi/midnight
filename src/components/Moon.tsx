import { forwardRef } from 'react';

/**
 * Three wrappers so three independent motions never fight over one transform:
 *  .moon-stage  -> scene transition (recede / return)
 *  .moon-orbit  -> pointer parallax
 *  .moon        -> idle float + music-reactive halo
 */
const Moon = forwardRef<HTMLDivElement>(function Moon(_, ref) {
  return (
    <div className="moon-stage" ref={ref} aria-hidden="true">
      <div className="moon-orbit">
        <div className="moon">
          <span className="crater crater-one" />
          <span className="crater crater-two" />
          <span className="crater crater-three" />
          <span className="crater crater-four" />
          <span className="crater crater-five" />
        </div>
      </div>
    </div>
  );
});

export default Moon;
