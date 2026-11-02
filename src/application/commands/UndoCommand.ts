import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';

export class UndoCommand extends Command {
  override execute(session: EditorSession, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'undo');
    args.expect(0);
    return session.undo();
  }
}
