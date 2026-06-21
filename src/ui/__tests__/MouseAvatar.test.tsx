// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MouseAvatar } from '../MouseAvatar';
import { avatarSrc } from '../avatarArt';

describe('MouseAvatar', () => {
  it('rendert die Sitz-Grafik als <img> (avatarArt-Slot)', () => {
    const { container } = render(<MouseAvatar colorIndex={2} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe(avatarSrc(2));
  });

  it('ein explizites src überschreibt die Sitz-Grafik', () => {
    const { container } = render(<MouseAvatar colorIndex={0} src="/custom.png" />);
    expect(container.querySelector('img')!.getAttribute('src')).toBe('/custom.png');
  });

  it('zeigt das KI-Abzeichen, wenn isAI gesetzt ist', () => {
    const { getByText } = render(<MouseAvatar colorIndex={1} isAI />);
    expect(getByText('KI')).toBeTruthy();
  });

  it('ist dekorativ (aria-hidden)', () => {
    const { container } = render(<MouseAvatar colorIndex={0} />);
    expect(container.querySelector('.avatar')!.getAttribute('aria-hidden')).toBe('true');
  });
});
