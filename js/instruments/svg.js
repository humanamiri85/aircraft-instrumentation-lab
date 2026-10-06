export const point = (angle, radius = 80) => [
  100 + Math.sin(angle * Math.PI / 180) * radius,
  100 - Math.cos(angle * Math.PI / 180) * radius
];

export const text = (x, y, value, size = 13, className = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" class="${className}">${value}</text>`;

export function tick(angle, outer = 80, length = 10, major = true) {
  const a = point(angle, outer), b = point(angle, outer - length);
  return `<path class="tick ${major ? 'major' : 'minor'}" d="M${a}L${b}"/>`;
}

export function scale(min, max, step, angle, labelEvery = 1, label = v => v, radius = 80) {
  let content = '';
  for (let value = min, i = 0; value <= max; value += step, i++) {
    const major = i % labelEvery === 0;
    content += tick(angle(value), radius, major ? 10 : 5, major);
    if (major) {
      const [x, y] = point(angle(value), radius - 23);
      content += text(x, y + 4, label(value), 13, 'scale-number');
    }
  }
  return content;
}

export function arc(start, end, radius, color, width = 5) {
  const a = point(start, radius), b = point(end, radius);
  return `<path d="M${a}A${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${b}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
}

export const needle = (id, length = 65, width = 4) =>
  `<g data-part="${id}"><path class="needle" d="M${100 - width} 114L99 ${100 - length + 7}L100 ${100 - length}L101 ${100 - length + 7}L${100 + width} 114Z"/></g>`;
export const hub = '<circle class="hub" cx="100" cy="100" r="7"/><circle cx="100" cy="100" r="2" fill="#a8b0b1"/>';

export function face(content) {
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <rect x="1" y="1" width="198" height="198" rx="17" fill="#252b2f" stroke="#434b50"/>
    <circle cx="100" cy="100" r="94" fill="#080c0e" stroke="#42494d" stroke-width="6"/>
    <circle cx="100" cy="100" r="87" fill="#101416" stroke="#232b2e"/>
    ${content}
    ${[[13, 13], [187, 13], [13, 187], [187, 187]].map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="3" fill="#687174"/><path d="M${x - 2} ${y + 2}l4 -4" stroke="#22292d"/>`).join('')}
  </svg>`;
}

export const rotate = (element, angle) => element.setAttribute('transform', `rotate(${angle} 100 100)`);
export function mount(element, content) {
  element.innerHTML = face(content);
  return id => element.querySelector(`[data-part="${id}"]`);
}
