import { COLLISION_LIMIT, COUNTDOWN_LABELS } from '../race/raceConfig.js';
import { formatRaceTime } from '../race/raceState.js';
import { getCheckpointText, getFailReasonText, getGamePhaseText, getText } from './language.js';

export function GameOverlay({
  checkpoint,
  chunkLoading,
  gameState,
  language = 'en',
  onFreeDrive,
  onRestart,
  onResume,
  onStart,
  onStartTransportMission,
  raceModeEnabled,
  showLaunch
}) {
  if (!raceModeEnabled && !showLaunch) return null;
  if (gameState.phase === 'running') return null;
  const t = (key) => getText(language, key);

  if (gameState.phase === 'countdown') {
    return (
      <section className="game-overlay game-overlay--countdown" aria-live="assertive">
        <strong>{COUNTDOWN_LABELS[gameState.countdownStep] ?? 'GO'}</strong>
      </section>
    );
  }

  const isResult = gameState.phase === 'finished' || gameState.phase === 'failed';
  const isPaused = gameState.phase === 'paused';
  const primaryAction = isPaused ? onResume : isResult ? onRestart : onStart;
  const primaryLabel = chunkLoading
    ? t('loading')
    : isPaused
      ? t('resume')
      : isResult
        ? t('restart')
        : t('startRace');

  return (
    <section className="game-overlay" aria-label={t('startRace')}>
      <div className="game-card">
        <span className="game-card__eyebrow">City Racer</span>
        <h1>{isResult || isPaused ? getGamePhaseText(language, gameState.phase) : 'Showcase Sprint'}</h1>
        {gameState.phase === 'finished' ? (
          <p>
            {language === 'zh' ? '完成时间' : 'Finished in'} {formatRaceTime(gameState.resultMs)}.
            {t('best')}: {gameState.bestMs ? formatRaceTime(gameState.bestMs) : '--'}.
          </p>
        ) : null}
        {gameState.phase === 'failed' ? (
          <p>
            {t('failed')}: {getFailReasonText(language, gameState.failReason || 'Race stopped')}.
            {t('time')}: {formatRaceTime(gameState.resultMs)}.
          </p>
        ) : null}
        {isPaused ? (
          <p>
            {language === 'zh' ? '比赛已暂停。前方安全后继续，或从起点重开。' : 'Race paused. Resume when the route ahead is clear, or restart from the start line.'}
          </p>
        ) : null}
        {!isResult && !isPaused ? (
          <p>
            {language === 'zh'
              ? '在 90 秒内通过检查点并完成地面路线。WASD 或方向键驾驶，Shift/Space 使用氮气，M 打开地图。'
              : 'Reach each checkpoint and finish the ground route within 90 seconds. Use WASD or arrow keys. Shift or Space uses nitro. M opens the map.'}
          </p>
        ) : null}
        <dl className="game-card__rules">
          <div>
            <dt>{t('next')}</dt>
            <dd>{getCheckpointText(language, checkpoint)}</dd>
          </div>
          <div>
            <dt>{language === 'zh' ? '限制' : 'Limit'}</dt>
            <dd>90s / {COLLISION_LIMIT} {t('collisionHits')}</dd>
          </div>
          <div>
            <dt>{t('route')}</dt>
            <dd>{language === 'zh' ? '地面主路' : 'Ground main road'}</dd>
          </div>
        </dl>
        <div className="game-card__actions">
          <button type="button" onClick={primaryAction} disabled={chunkLoading}>
            {primaryLabel}
          </button>
          <button
            type="button"
            className="game-card__secondary"
            onClick={onFreeDrive}
            disabled={chunkLoading}
          >
            {t('freeDrive')}
          </button>
          {onStartTransportMission ? (
            <button
              type="button"
              className="game-card__secondary game-card__wide"
              onClick={onStartTransportMission}
              disabled={chunkLoading}
            >
              {t('cargoRun')}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
