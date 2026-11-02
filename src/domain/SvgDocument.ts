import { Shape } from './Shape.ts';
import { Group } from './Group.ts';
import { Numbers } from './Numbers.ts';

export class SvgDocument {
  private width: number;
  private height: number;
  private readonly root = new Group('__document_root__');
  constructor(width = 800, height = 600) {
    this.width = Numbers.positive(width, 'canvas width');
    this.height = Numbers.positive(height, 'canvas height');
  }
  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }
  getRoot(): Group { return this.root; }
  resize(width: number, height: number): void {
    Numbers.positive(width, 'canvas width'); Numbers.positive(height, 'canvas height');
    this.width = width; this.height = height;
  }
  all(): Shape[] { return this.root.getChildren().flatMap(child => child.walk()); }
  find(id: string): Shape | undefined { return this.all().find(shape => shape.getId() === id); }
  require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  requireGroup(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  parentOf(shape: Shape): Group {
    const parent = [this.root, ...this.all()].find(node => node instanceof Group && node.getChildren().includes(shape));
    if (!(parent instanceof Group)) throw new Error(`no such shape: ${shape.getId()}`);
    return parent;
  }
  insert(shape: Shape, parentId?: string): void {
    const ids = new Set(this.all().map(node => node.getId()));
    for (const node of shape.walk()) {
      if (ids.has(node.getId())) throw new Error(`id already exists: ${node.getId()}`);
      ids.add(node.getId());
    }
    (parentId === undefined ? this.root : this.requireGroup(parentId)).insert(shape);
  }
  delete(id: string): void { const shape = this.require(id); this.parentOf(shape).remove(shape); }
  addTo(gid: string, id: string): void {
    const group = this.requireGroup(gid), shape = this.require(id);
    if (shape.contains(group)) throw new Error(`cannot move a container into its own descendant: ${id}`);
    this.parentOf(shape).remove(shape); group.insert(shape);
  }
  group(id: string, ids: readonly string[]): Group {
    if (this.find(id)) throw new Error(`id already exists: ${id}`);
    if (!ids.length) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map(member => this.require(member));
    for (const a of selected) for (const b of selected) {
      if (a !== b && a.contains(b)) throw new Error(`cannot group a container into its own descendant: ${a.getId()}`);
    }
    const ordered = this.all().filter(node => selected.includes(node));
    let parent = this.parentOf(ordered[0]!);
    while (!ordered.every(node => parent.contains(node))) parent = this.parentOf(parent);
    const index = parent.getChildren().findIndex(node => node.contains(ordered[0]!));
    const group = new Group(id);
    for (const node of ordered) { this.parentOf(node).remove(node); group.insert(node); }
    parent.insert(group, index);
    return group;
  }
  ungroup(id: string): number {
    const group = this.requireGroup(id), parent = this.parentOf(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const children = group.getChildren(), index = parent.remove(group);
    children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
    return children.length;
  }
  reorder(id: string, front: boolean): void {
    const shape = this.require(id), parent = this.parentOf(shape);
    parent.remove(shape); parent.insert(shape, front ? parent.getChildren().length : 0);
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    for (const child of this.root.getChildren()) copy.root.insert(child.clone());
    return copy;
  }
}
