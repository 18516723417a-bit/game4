import { getText } from './language.js';

export function VirtualControls({ language = 'en', setTouchControl }) {
  const t = (key) => getText(language, key);

  return (
    <div className="mobile-controls" aria-label={language === 'zh' ? '触控驾驶控制' : 'Touch driving controls'}>
      <div className="mobile-controls__steer">
        <button type="button" {...getTouchButtonProps('left', setTouchControl)}>
          {t('left')}
        </button>
        <button type="button" {...getTouchButtonProps('right', setTouchControl)}>
          {t('right')}
        </button>
      </div>
      <div className="mobile-controls__pedals">
        <button type="button" {...getTouchButtonProps('forward', setTouchControl)}>
          {t('gas')}
        </button>
        <button type="button" {...getTouchButtonProps('backward', setTouchControl)}>
          {t('brake')}
        </button>
        <button type="button" {...getTouchButtonProps('handbrake', setTouchControl)}>
          {t('drift')}
        </button>
        <button
          type="button"
          className="mobile-controls__nitro"
          {...getTouchButtonProps('nitro', setTouchControl)}
        >
          {t('nitro')}
        </button>
      </div>
    </div>
  );
}

function getTouchButtonProps(action, setTouchControl) {
  const press = (event) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture can be unavailable after browser gesture cancellation.
    }
    setTouchControl(action, true);
  };
  const release = (event) => {
    event.preventDefault();
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Ignore duplicate release events from pointerleave/cancel.
    }
    setTouchControl(action, false);
  };

  return {
    onPointerDown: press,
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release
  };
}
