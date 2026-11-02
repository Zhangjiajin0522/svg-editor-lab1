import type { EditCommand } from './EditCommand.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';

export class History {
  private readonly past: EditCommand[] = [];
  private readonly future: EditCommand[] = [];
  private blocked = true;
  record(command: EditCommand): void {
    this.past.push(command); this.future.length = 0; this.blocked = false;
  }
  barrier(): void {
    this.past.length = 0; this.future.length = 0; this.blocked = true;
  }
  undo(): { document: SvgDocument; feedback: string } {
    this.checkBarrier();
    const command = this.past.at(-1);
    if (!command) throw new Error('nothing to undo');
    const document = command.undo();
    this.past.pop(); this.future.push(command);
    return { document, feedback: `undone: ${command.describe()}` };
  }
  redo(): { document: SvgDocument; feedback: string } {
    this.checkBarrier();
    const command = this.future.at(-1);
    if (!command) throw new Error('nothing to redo');
    const document = command.redo();
    this.future.pop(); this.past.push(command);
    return { document, feedback: `redone: ${command.describe()}` };
  }
  private checkBarrier(): void {
    if (this.blocked) throw new Error('undo not allowed after io command');
  }
}
