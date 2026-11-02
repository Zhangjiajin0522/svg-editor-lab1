import { GeometryShape } from './GeometryShape.ts';

export class Ellipse extends GeometryShape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) { super(id, { cx, cy, rx, ry }, ["rx", "ry"]); }
  override getTag(): string { return 'ellipse'; }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ["cx"], ["cy"]); }
  override clone(): Ellipse { return this.copyStyles(new Ellipse(this.getId(), this.value('cx'), this.value('cy'), this.value('rx'), this.value('ry'))); }
}
