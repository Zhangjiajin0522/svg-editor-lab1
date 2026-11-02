import { GeometryShape } from './GeometryShape.ts';

export class Line extends GeometryShape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) { super(id, { x1, y1, x2, y2 }, []); }
  override getTag(): string { return 'line'; }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ["x1", "x2"], ["y1", "y2"]); }
  override clone(): Line { return this.copyStyles(new Line(this.getId(), this.value('x1'), this.value('y1'), this.value('x2'), this.value('y2'))); }
}
