import { Shape } from './Shape.ts';
import { Numbers } from './Numbers.ts';

export class Group extends Shape {
  private readonly children: Shape[] = [];
  constructor(id: string) { super(id); }
  override getTag(): string { return 'g'; }
  override getChildren(): readonly Shape[] { return [...this.children]; }
  insert(shape: Shape, index = this.children.length): void {
    if (shape === this || shape.contains(this)) throw new Error('cannot create a container cycle');
    if (this.children.includes(shape)) throw new Error(`shape already in container: ${shape.getId()}`);
    if (!Number.isInteger(index) || index < 0 || index > this.children.length) throw new Error('invalid child index');
    this.children.splice(index, 0, shape);
  }
  remove(shape: Shape): number {
    const index = this.children.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.getId()}`);
    this.children.splice(index, 1); return index;
  }
  override move(dx: number, dy: number): void {
    Numbers.finite(dx, 'dx'); Numbers.finite(dy, 'dy');
    for (const child of this.children) child.move(dx, dy);
  }
  override scale(factor: number): void {
    Numbers.positive(factor, 'scale factor');
    for (const child of this.children) child.scale(factor);
  }
  override clone(): Group {
    const group = this.copyStyles(new Group(this.getId()));
    for (const child of this.children) group.insert(child.clone());
    return group;
  }
  protected override geometrySummary(): string { return ''; }
}
