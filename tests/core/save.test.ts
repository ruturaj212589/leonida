import { afterEach, describe, expect, it, vi } from 'vitest';
import { Events } from '../../src/core/Events';
import { Save } from '../../src/core/Save';
import { Time } from '../../src/core/Time';

const valid = { version: Save.VERSION, savedAt: 0, time: { hour: 18, day: 3 }, systems: { player: { cash: 50 } } };

function setup(raw: string) {
  vi.stubGlobal('localStorage', { getItem: () => raw });
  const events = new Events();
  const time = new Time(events);
  const save = new Save(events, time);
  const restore = vi.fn();
  const loaded = vi.fn();
  save.register('player', { deserialize: restore });
  events.on('save:loaded', loaded);
  return { time, save, restore, loaded };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Save.load', () => {
  it.each([
    'null',
    JSON.stringify({ ...valid, time: null }),
    JSON.stringify({ ...valid, time: { hour: '18', day: 3 } }),
    JSON.stringify({ ...valid, systems: [] }),
    JSON.stringify({ ...valid, systems: null }),
    '{"version":1,"time":{"hour":1e400,"day":3},"systems":{}}',
  ])('rejects malformed save %s before changing game state', (raw) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { time, save, restore, loaded } = setup(raw);
    const before = time.serialize();

    expect(save.load()).toBe(false);
    expect(time.serialize()).toEqual(before);
    expect(restore).not.toHaveBeenCalled();
    expect(loaded).not.toHaveBeenCalled();
  });

  it('restores a valid save and emits the load event', () => {
    const { time, save, restore, loaded } = setup(JSON.stringify(valid));

    expect(save.load()).toBe(true);
    expect(time.serialize()).toEqual(valid.time);
    expect(restore).toHaveBeenCalledWith(valid.systems.player);
    expect(loaded).toHaveBeenCalledWith({ slot: 'main' });
  });
});
