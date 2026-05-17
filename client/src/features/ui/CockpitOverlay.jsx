export function CockpitOverlay({ telemetry }) {
  const speedRatio = Math.min((telemetry.speedKmh ?? 0) / 180, 1);
  const nitroRatio = Math.max(0, Math.min(1, telemetry.nitroRatio ?? 1));
  const steering = Math.max(-1, Math.min(1, telemetry.steering ?? 0));
  const impact = Math.max(0, Math.min(1, telemetry.collisionPulse ?? 0));
  const nitroActive = telemetry.nitroActive ? 1 : 0;
  const speedNeedle = -128 + speedRatio * 256;
  const nitroNeedle = -118 + nitroRatio * 236;
  const wheelLift = speedRatio * 7 + impact * 8;

  return (
    <div
      className="cockpit-overlay"
      aria-hidden="true"
      style={{
        '--cockpit-sway': `${(-steering * 8).toFixed(2)}px`,
        '--cockpit-counter-sway': `${(steering * 5).toFixed(2)}px`,
        '--cockpit-roll': `${(-steering * 0.38).toFixed(3)}deg`,
        '--cockpit-speed-drop': `${(speedRatio * 5).toFixed(2)}px`,
        '--cockpit-impact-drop': `${(impact * 9).toFixed(2)}px`,
        '--cockpit-vignette': (0.2 + speedRatio * 0.16 + impact * 0.24).toFixed(3),
        '--cockpit-nitro': nitroActive.toFixed(3)
      }}
    >
      <div className="cockpit-windshield">
        <span className="cockpit-pillar cockpit-pillar--left" />
        <span className="cockpit-pillar cockpit-pillar--right" />
        <span className="cockpit-mirror" />
        <span className="cockpit-hood" />
      </div>
      <div className="cockpit-dashboard">
        <span className="cockpit-vent cockpit-vent--left" />
        <InstrumentGauge label="SPD" needle={speedNeedle} value={Math.round(telemetry.speedKmh ?? 0)} />
        <div className="cockpit-readout">
          <strong>{Math.round(telemetry.speedKmh ?? 0)}</strong>
          <span>km/h</span>
        </div>
        <InstrumentGauge label="N2O" needle={nitroNeedle} value={Math.round(nitroRatio * 100)} />
        <span className="cockpit-vent cockpit-vent--right" />
      </div>
      <div
        className="cockpit-wheel"
        style={{
          transform: `translateX(-50%) translateY(${wheelLift.toFixed(2)}px) rotate(${(-steering * 34).toFixed(2)}deg)`
        }}
      >
        <span className="cockpit-wheel__hub" />
        <span className="cockpit-wheel__spoke cockpit-wheel__spoke--top" />
        <span className="cockpit-wheel__spoke cockpit-wheel__spoke--left" />
        <span className="cockpit-wheel__spoke cockpit-wheel__spoke--right" />
        <span className="cockpit-hand cockpit-hand--left" />
        <span className="cockpit-hand cockpit-hand--right" />
      </div>
    </div>
  );
}

function InstrumentGauge({ label, needle, value }) {
  return (
    <div className="cockpit-gauge">
      <span>{label}</span>
      <i style={{ transform: `translateX(-50%) rotate(${needle.toFixed(2)}deg)` }} />
      <strong>{value}</strong>
    </div>
  );
}
