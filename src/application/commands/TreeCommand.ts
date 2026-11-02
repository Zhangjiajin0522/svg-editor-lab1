import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';
import { TreeFormatter } from '../TreeFormatter.ts';

export class TreeCommand extends Command {
  override execute(session: EditorSession, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'tree [id]');
    args.expect(0, 1);
    return new TreeFormatter().tree(session.getDocument(), values[0]);
  }
}
