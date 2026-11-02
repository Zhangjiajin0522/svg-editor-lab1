import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';

export class CanvasCommand extends Command {
  override execute(session: EditorSession, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'canvas [w] [h]');
    const document = session.getDocument();
    if (values.length === 0) return [`canvas ${document.getWidth()}x${document.getHeight()}`];
    args.expect(1, 2);
    const width = args.number(0, 'width'), height = values.length === 2 ? args.number(1, 'height') : document.getHeight();
    session.resize(width, height);
    return [`canvas resized to ${width}x${height}`];
  }
}
