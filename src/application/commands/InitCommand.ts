import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';

export class InitCommand extends Command {
  override execute(session: EditorSession, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'init [w] [h]');
    args.expect(0, 2);
    const width = values.length > 0 ? args.number(0, 'width') : 800;
    const height = values.length > 1 ? args.number(1, 'height') : 600;
    session.init(width, height);
    return [`canvas ${width}x${height} created`];
  }
}
