import { Shape } from './Shape.ts';
import { Numbers } from './Numbers.ts';

export abstract class GeometryShape extends Shape {
  private readonly geometry = new Map<string, number>();
  private readonly sizes: readonly string[];
  protected constructor(id: string, values: Record<string, number>, sizes: readonly string[] = []) {
    super(id);
    this.sizes = sizes;
    for (const [key, value] of Object.entries(values)) this.geometry.set(key, this.validate(key, value));
  }
  private validate(key: string, value: number): number {
    return this.sizes.includes(key) ? Numbers.nonnegative(value, key) : Numbers.finite(value, key);
  }
  protected value(key: string): number { return this.geometry.get(key)!; }
  protected translate(dx: number, dy: number, xs: readonly string[], ys: readonly string[]): void {
    Numbers.finite(dx, 'dx'); Numbers.finite(dy, 'dy');
    const updates = new Map<string, number>();
    for (const key of xs) updates.set(key, Numbers.finite(this.value(key) + dx, key));
    for (const key of ys) updates.set(key, Numbers.finite(this.value(key) + dy, key));
    for (const [key, value] of updates) this.geometry.set(key, value);
  }
  override scale(factor: number): void {
    Numbers.positive(factor, 'scale factor');
    const next = [...this.geometry].map(([key, value]) => [key, this.validate(key, value * factor)] as const);
    for (const [key, value] of next) this.geometry.set(key, value);
  }
  override setAttribute(name: string, value: string): void {
    if (this.geometry.has(name)) this.geometry.set(name, this.validate(name, Numbers.parse(value, name)));
    else super.setAttribute(name, value);
  }
  override getAttributes(): Readonly<Record<string, string>> {
    return { ...super.getAttributes(), ...Object.fromEntries([...this.geometry].map(([k, v]) => [k, String(v)])) };
  }
  protected override geometrySummary(): string {
    return [...this.geometry].map(([k, v]) => `${k === 'width' ? 'w' : k === 'height' ? 'h' : k}=${v}`).join(' ');
  }
}
