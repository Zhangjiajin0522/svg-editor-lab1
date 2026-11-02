import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';

export class ReadCommand extends Command {
  override execute(session: EditorSession, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'read <file.svg>');
    args.expect(1);
    return session.read(args.text(0));
  }
}
