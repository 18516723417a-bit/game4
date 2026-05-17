import { useEffect, useRef } from 'react';

const keyMap = {
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'backward',
  KeyS: 'backward',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyR: 'reset',
  KeyE: 'handbrake',
  ShiftLeft: 'nitro',
  ShiftRight: 'nitro',
  Space: 'nitro'
};

export function useVehicleInput() {
  const inputRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    reset: false,
    nitro: false,
    handbrake: false
  });

  useEffect(() => {
    const clearInput = () => {
      inputRef.current.forward = false;
      inputRef.current.backward = false;
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.reset = false;
      inputRef.current.nitro = false;
      inputRef.current.handbrake = false;
    };
    const setKey = (event, pressed) => {
      const action = keyMap[event.code];
      if (!action) return;

      event.preventDefault();
      inputRef.current[action] = pressed;
    };

    const onKeyDown = (event) => setKey(event, true);
    const onKeyUp = (event) => setKey(event, false);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') clearInput();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInput);
    window.addEventListener('pagehide', clearInput);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInput);
      window.removeEventListener('pagehide', clearInput);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return inputRef;
}
