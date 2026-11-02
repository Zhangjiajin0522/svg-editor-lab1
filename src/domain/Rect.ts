import { GeometryShape } from './GeometryShape.ts';

export class Rect extends GeometryShape {
  constructor(id: string, x: number, y: number, width: number, height: number) { super(id, { x, y, width, height }, ["width", "height"]); }
  override getTag(): string { return 'rect'; }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ["x"], ["y"]); }
  override clone(): Rect { return this.copyStyles(new Rect(this.getId(), this.value('x'), this.value('y'), this.value('width'), this.value('height'))); }
}
