import { GeometryShape } from './GeometryShape.ts';

export class Circle extends GeometryShape {
  constructor(id: string, cx: number, cy: number, r: number) { super(id, { cx, cy, r }, ["r"]); }
  override getTag(): string { return 'circle'; }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ["cx"], ["cy"]); }
  override clone(): Circle { return this.copyStyles(new Circle(this.getId(), this.value('cx'), this.value('cy'), this.value('r'))); }
}
