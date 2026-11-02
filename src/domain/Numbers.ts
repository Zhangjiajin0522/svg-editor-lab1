export class Numbers {
  static parse(value: string, name: string): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) throw new Error(`invalid number: ${name}`);
    return this.finite(Number(value), name);
  }
  static finite(value: number, name: string): number {
    if (!Number.isFinite(value)) throw new Error(`invalid number: ${name}`);
    return Object.is(value, -0) ? 0 : value;
  }
  static positive(value: number, name: string): number {
    this.finite(value, name);
    if (value <= 0) throw new Error(`${name} must be positive`);
    return value;
  }
  static nonnegative(value: number, name: string): number {
    this.finite(value, name);
    if (value < 0) throw new Error(`${name} must be non-negative`);
    return value;
  }
}
