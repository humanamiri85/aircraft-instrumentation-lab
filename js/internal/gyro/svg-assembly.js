// Shared labeled conceptual rotor / bearings for an SVG projection.
export function gyroAssembly() {
  return `<g class="attitude-gyro">
    <g data-component="outer"><ellipse cx="0" cy="0" rx="68" ry="55" class="gyro-outer"/><path d="M-80 0h12M68 0h12" class="gyro-bearing"/></g>
    <g data-component="inner"><ellipse cx="0" cy="0" rx="50" ry="38" class="gyro-inner"/><path d="M0 -55v17M0 38v17" class="gyro-bearing"/></g>
    <g data-component="rotor"><circle r="27" class="gyro-wheel"/><g data-rotor-spokes><path d="M0 0L23 0M0 0L-12 20M0 0L-12 -20"/></g></g>
    <g data-component="spin"><path d="M0 -75V75M-5 -65L0 -75L5 -65" class="gyro-shaft"/></g>
  </g>`;
}
