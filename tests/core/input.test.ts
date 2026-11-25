import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../../src/core/Input';

function setup(requestPointerLock?: () => Promise<void> | void) {
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('document', new EventTarget());
  const canvas = Object.assign(new EventTarget(), { requestPointerLock });
  return { canvas, input: new Input(canvas as unknown as HTMLCanvasElement) };
}

afterEach(() => vi.unstubAllGlobals());

describe('Input.requestPointerLock', () => {
  it('allows canvas mouse input when the browser lacks pointer lock', () => {
    const { canvas, input } = setup();

    expect(() => input.requestPointerLock()).not.toThrow();
    canvas.dispatchEvent(Object.assign(new Event('mousedown'), { button: 0 }));

    expect(input.pointerLocked).toBe(false);
    expect(input.wasPressed('Mouse0')).toBe(true);
  });

  it('calls the legacy API with the canvas as its receiver', () => {
    const request = vi.fn();
    const { canvas, input } = setup(request);

    input.requestPointerLock();

    expect(request.mock.contexts).toEqual([canvas]);
  });

  it('handles a rejected promise from the modern API', async () => {
    const request = vi.fn().mockRejectedValue(new Error('Gesture required'));
    const { input } = setup(request);

    input.requestPointerLock();
    await Promise.resolve();

    expect(request).toHaveBeenCalledOnce();
    expect(input.pointerLocked).toBe(false);
  });
});
