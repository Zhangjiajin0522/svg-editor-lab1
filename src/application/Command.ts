import type { EditorSession } from './EditorSession.ts';

export abstract class Command {
  abstract execute(session: EditorSession, args: readonly string[]): string[];
}
