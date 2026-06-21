import { describe, expect, it } from 'vitest';
import { createRNG, type RNG } from '../../engine';
import {
  applyAction,
  createRoom,
  joinRoom,
  leaveRoom,
  reconnectSeat,
  seatInfos,
  startRoom,
  type Room,
} from '../room';

function rng(): RNG {
  return createRNG(12345);
}

/** Schaltet als Host bis in eine Zielphase weiter. */
function advanceTo(room: Room, r: RNG, phase: string): Room {
  let cur = room;
  for (let i = 0; i < 8 && cur.state?.phase !== phase; i++) {
    const res = applyAction(cur, cur.hostSeat, { type: 'advance' }, r);
    cur = res.room;
  }
  return cur;
}

describe('createRoom / joinRoom', () => {
  it('legt einen Host-Sitz an und vergibt Engine-IDs in Reihenfolge', () => {
    const room = createRoom('AB12', 'Anna', { ais: 1 });
    expect(room.seats).toHaveLength(2);
    expect(room.seats[0]).toMatchObject({ id: 'p0', name: 'Anna', isAI: false });
    expect(room.seats[1]).toMatchObject({ id: 'p1', isAI: true });
    expect(room.hostSeat).toBe('p0');
  });

  it('fügt menschliche Sitze hinzu und nummeriert konsistent', () => {
    let room = createRoom('AB12', 'Anna');
    const j = joinRoom(room, 'Ben');
    room = j.room;
    expect(j.seat).toBe('p1');
    expect(seatInfos(room).map((s) => s.name)).toEqual(['Anna', 'Ben']);
  });

  it('lehnt Beitritt zu vollem Raum ab', () => {
    let room = createRoom('AB12', 'A');
    for (const n of ['B', 'C', 'D', 'E', 'F']) room = joinRoom(room, n).room; // 6 Sitze voll
    const res = joinRoom(room, 'G');
    expect(res.error).toBeDefined();
    expect(res.room.seats).toHaveLength(6);
  });
});

describe('leaveRoom', () => {
  it('renummeriert vor Spielstart und bestimmt den Host neu', () => {
    let room = createRoom('AB12', 'Anna'); // p0 host
    room = joinRoom(room, 'Ben').room; // p1
    room = joinRoom(room, 'Cara').room; // p2
    room = leaveRoom(room, 'p0'); // Host geht
    expect(room.seats.map((s) => s.name)).toEqual(['Ben', 'Cara']);
    expect(room.seats.map((s) => s.id)).toEqual(['p0', 'p1']);
    expect(room.hostSeat).toBe('p0'); // Ben ist neuer Host
  });

  it('markiert getrennte Sitze im laufenden Spiel, ohne sie zu entfernen', () => {
    let room = createRoom('AB12', 'Anna', { ais: 1 });
    room = startRoom(room, rng()).room;
    room = leaveRoom(room, 'p0');
    expect(room.seats).toHaveLength(2);
    expect(room.seats.find((s) => s.id === 'p0')?.connected).toBe(false);
  });
});

describe('reconnectSeat', () => {
  it('markiert einen getrennten Sitz wieder als verbunden', () => {
    let room = createRoom('AB12', 'Anna', { ais: 1 });
    room = startRoom(room, rng()).room;
    room = leaveRoom(room, 'p0');
    expect(room.seats.find((s) => s.id === 'p0')?.connected).toBe(false);
    room = reconnectSeat(room, 'p0');
    expect(room.seats.find((s) => s.id === 'p0')?.connected).toBe(true);
  });

  it('lässt unbekannte Sitze unverändert', () => {
    const room = createRoom('AB12', 'Anna');
    expect(reconnectSeat(room, 'p9')).toBe(room);
  });
});

describe('startRoom', () => {
  it('startet erst ab 2 Sitzen und würfelt Runde 1', () => {
    const solo = createRoom('AB12', 'Anna');
    expect(startRoom(solo, rng()).error).toBeDefined();

    const room = createRoom('AB12', 'Anna', { ais: 1 });
    const res = startRoom(room, rng());
    expect(res.error).toBeUndefined();
    expect(res.room.started).toBe(true);
    expect(res.room.state?.phase).toBe('roll');
    expect(res.room.state?.players.every((p) => p.rolled.length > 0)).toBe(true);
  });
});

describe('applyAction – Autorität', () => {
  it('lässt nur den Host weiterschalten', () => {
    const room = startRoom(createRoom('AB12', 'A', { ais: 1 }), rng()).room;
    const res = applyAction(room, 'p1', { type: 'advance' }, rng());
    expect(res.error).toBeDefined();
    expect(res.room.state?.phase).toBe('roll');
  });

  it('verbietet Tausch fremder Würfel', () => {
    const r = rng();
    let room = startRoom(createRoom('AB12', 'A', { ais: 1 }), r).room;
    room = advanceTo(room, r, 'swap');
    // p0 versucht, einen nicht existierenden/fremden Würfel zu tauschen
    const res = applyAction(room, 'p0', { type: 'swap', dieIds: ['fremd'] }, r);
    expect(res.error).toBeDefined();
  });

  it('verbietet Draft, wenn man nicht am Zug ist', () => {
    const r = rng();
    // Zwei Menschen, keine KI: p0 ist zuerst am Zug.
    let room = createRoom('AB12', 'A');
    room = joinRoom(room, 'B').room;
    room = startRoom(room, r).room;
    room = advanceTo(room, r, 'draft');
    const offerId = room.state!.draftOffers[0]?.id;
    const res = applyAction(room, 'p1', { type: 'draftPick', offerId }, r);
    expect(res.error).toBeDefined();
  });

  it('spielt KI-Drafter automatisch, bis ein Mensch am Zug ist', () => {
    const r = rng();
    let room = startRoom(createRoom('AB12', 'A', { ais: 1 }), r).room;
    room = advanceTo(room, r, 'draft');
    expect(room.state?.phase).toBe('draft');
    // Aktiver Drafter muss der menschliche Host sein (KI hat schon gezogen).
    const active = room.state!.players.find((p) => !room.state!.draftedThisPhase.includes(p.id));
    expect(active?.id).toBe('p0');
  });

  it('führt einen kompletten Draft per Host-Pick zu Ende', () => {
    const r = rng();
    let room = startRoom(createRoom('AB12', 'A', { ais: 1 }), r).room;
    room = advanceTo(room, r, 'draft');
    const offerId = room.state!.draftOffers[0]?.id;
    const res = applyAction(room, 'p0', { type: 'draftPick', offerId }, r);
    expect(res.error).toBeUndefined();
    // Nach dem menschlichen Pick haben alle gedraftet.
    const open = res.room.state!.players.some(
      (p) => !res.room.state!.draftedThisPhase.includes(p.id)
    );
    expect(open).toBe(false);
  });

  it('blockiert advance im Draft, solange nicht alle gewählt haben', () => {
    const r = rng();
    let room = startRoom(createRoom('AB12', 'A', { ais: 1 }), r).room;
    room = advanceTo(room, r, 'draft');
    const res = applyAction(room, 'p0', { type: 'advance' }, r);
    expect(res.error).toBeDefined();
  });
});
