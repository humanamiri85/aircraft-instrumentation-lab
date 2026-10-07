// Shared slow rotor cue, deliberately not physical RPM.
export function advanceSpin(phase, dt, reduced=false) {
  return reduced ? 0 : (phase + Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1))*1.2) % (2*Math.PI);
}
