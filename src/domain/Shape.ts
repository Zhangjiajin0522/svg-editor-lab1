import { Numbers } from './Numbers.ts';

export abstract class Shape {
  private readonly id: string;
  private readonly styles = new Map<string, string>();
  protected constructor(id: string) {
    if (!id || /\s|[\u0000-\u001f]/u.test(id)) throw new Error('id must be non-empty and contain no whitespace');
    this.id = id;
  }
  getId(): string { return this.id; }
  abstract getTag(): string;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  protected abstract geometrySummary(): string;
  getChildren(): readonly Shape[] { return []; }
  walk(): Shape[] { return [this, ...this.getChildren().flatMap(child => child.walk())]; }
  contains(shape: Shape): boolean { return this === shape || this.getChildren().some(child => child.contains(shape)); }
  getText(): string | undefined { return undefined; }
  getAttributes(): Readonly<Record<string, string>> { return { id: this.id, ...Object.fromEntries(this.styles) }; }
  setAttribute(name: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(name)) throw new Error(`unknown attribute: ${name}`);
    if (!value.trim()) throw new Error(`invalid value: ${name}`);
    if (name === 'stroke-width') value = String(Numbers.nonnegative(Numbers.parse(value, name), name));
    this.styles.set(name, value);
  }
  protected copyStyles<T extends Shape>(target: T): T {
    for (const [key, value] of this.styles) target.setAttribute(key, value);
    return target;
  }
  label(): string { return `${this.getTag()}#${this.id}`; }
  summary(): string {
    return [this.label(), this.geometrySummary(), ...[...this.styles].map(([k, v]) => `${k}=${v}`)].filter(Boolean).join('  ');
  }
}
