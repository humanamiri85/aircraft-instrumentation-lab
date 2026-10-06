// Shared numeric helpers; SVG angles run clockwise from twelve o'clock.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const mapRange = (value, min, max, start, end) =>
  lerp(start, end, (clamp(value, min, max) - min) / (max - min));
export const wrapHeading = value => ((value % 360) + 360) % 360;
export const headingDelta = (from, to) => wrapHeading(to - from + 180) - 180;
