import { GeometryShape } from './GeometryShape.ts';

export class TextShape extends GeometryShape {
  private content: string;
  constructor(id: string, x: number, y: number, content: string) {
    super(id, { x, y }); this.content = content;
  }
  override getTag(): string { return 'text'; }
  override getText(): string { return this.content; }
  override move(dx: number, dy: number): void { this.translate(dx, dy, ['x'], ['y']); }
  override setAttribute(name: string, value: string): void {
    if (name === 'text') this.content = value;
    else super.setAttribute(name, value);
  }
  override clone(): TextShape { return this.copyStyles(new TextShape(this.getId(), this.value('x'), this.value('y'), this.content)); }
  protected override geometrySummary(): string { return `(${this.value('x')},${this.value('y')}) ${JSON.stringify(this.content)}`; }
}
