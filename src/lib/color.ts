// Shared by experiments that draw outside CSS (canvas, WebGL) but take their colors from the light-dark() tokens

export type Rgba = [number, number, number, number];

let context: CanvasRenderingContext2D | undefined;

// Resolves any CSS color, such as oklch() or color-mix(), to RGBA from 0 to 255. A 2D canvas understands every color
// syntax the browser does, so paint one pixel and read it back.
export function toRgba(color: string): Rgba {
  context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a];
}

// A custom property holds the raw light-dark() text, so resolve the token through an element's computed color.
// The element should be in the document, so it inherits the page's color-scheme.
export function tokenRgba(name: string, probe: HTMLElement): Rgba {
  probe.style.color = `var(${name})`;
  return toRgba(getComputedStyle(probe).color);
}
