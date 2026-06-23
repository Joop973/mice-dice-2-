// Kleiner +/−-Zähler mit Min/Max. Geteilt von Setup (App) und Online-Connect,
// damit beide Screens dieselbe Steuerung nutzen (vorher dupliziert).

export function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="counter">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          −
        </button>
        <span className="counter__value">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  );
}
