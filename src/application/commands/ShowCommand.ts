import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';
import { TreeFormatter } from '../TreeFormatter.ts';

export class ShowCommand extends Command {
  override execute(session: EditorSession, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'show <id>');
    args.expect(1);
    return new TreeFormatter().show(session.getDocument(), args.text(0));
  }
}
