import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';

export class SaveCommand extends Command {
  override execute(session: EditorSession, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'save [file.svg]');
    args.expect(0, 1);
    return session.save(values[0]);
  }
}
