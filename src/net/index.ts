// Öffentliche API des Netzwerk-Moduls.
//
// Der autoritative Kern (room, lobby) ist transportunabhängig und wird sowohl
// vom Server (server/index.ts) als auch vom Loopback-Transport genutzt.

export * from './protocol';
export * from './room';
export { Lobby, type RoomEntry } from './lobby';
export type { Transport, ServerMessageHandler } from './transport';
export { LocalTransport } from './LocalTransport';
export { WebSocketTransport } from './WebSocketTransport';
