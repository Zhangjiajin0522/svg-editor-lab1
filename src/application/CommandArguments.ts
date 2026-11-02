import { Numbers } from '../domain/Numbers.ts';

export class CommandArguments {
  private readonly args: readonly string[];
  private readonly usage: string;
  constructor(args: readonly string[], usage: string) { this.args = args; this.usage = usage; }
  expect(min: number, max = min): void {
    if (this.args.length < min || this.args.length > max) throw new Error(`usage: ${this.usage}`);
  }
  text(index: number): string {
    const value = this.args[index];
    if (value === undefined) throw new Error(`usage: ${this.usage}`);
    return value;
  }
  number(index: number, name: string): number { return Numbers.parse(this.text(index), name); }
}
