// Phasen-Leiste: zeigt die vier Phasen einer Runde als Icon-Schritte mit Marker
// auf der aktuellen Phase; darunter die volle Bezeichnung. Geteilt lokal/online.

import { PHASE_ORDER, type Phase } from '../engine';
import { PHASE_ICON, PHASE_LABEL } from './phaseLabels';

export function PhaseTrack({ phase }: { phase: Phase }) {
  const idx = PHASE_ORDER.indexOf(phase);
  return (
    <div className="phasetrack" aria-label={`Phase: ${PHASE_LABEL[phase]}`}>
      <ol className="phasetrack__steps">
        {PHASE_ORDER.map((p, i) => (
          <li
            key={p}
            className={
              'phasetrack__step' +
              (i === idx ? ' is-current' : '') +
              (i < idx ? ' is-done' : '')
            }
            aria-current={i === idx ? 'step' : undefined}
          >
            <span className="phasetrack__icon" aria-hidden="true">
              {PHASE_ICON[p]}
            </span>
          </li>
        ))}
      </ol>
      <span className="phasetrack__label">{PHASE_LABEL[phase]}</span>
    </div>
  );
}
