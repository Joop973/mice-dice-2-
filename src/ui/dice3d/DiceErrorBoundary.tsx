// Fängt WebGL-/Three-Fehler ab, damit ein fehlender 3D-Kontext nie die ganze
// App weißt. Bei einem Fehler wird auf die 2D-Platzhalter zurückgefallen.

import { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class DiceErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
