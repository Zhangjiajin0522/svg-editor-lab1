import { Command } from './Command.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import type { ShapeFactory } from '../domain/ShapeFactory.ts';
import type { EditorSession } from './EditorSession.ts';

export abstract class EditCommand extends Command {
  private before?: SvgDocument;
  private after?: SvgDocument;
  private feedback: string[] = [];
  override execute(session: EditorSession, args: readonly string[]): string[] {
    const before = session.getDocument().clone();
    const working = before.clone();
    const feedback = this.edit(working, args, session.getFactory());
    this.before = before;
    this.after = working.clone();
    this.feedback = feedback;
    session.acceptEdit(this, working);
    return feedback;
  }
  protected abstract edit(document: SvgDocument, args: readonly string[], factory: ShapeFactory): string[];
  undo(): SvgDocument {
    if (!this.before) throw new Error('command has not executed');
    return this.before.clone();
  }
  redo(): SvgDocument {
    if (!this.after) throw new Error('command has not executed');
    return this.after.clone();
  }
  describe(): string { return this.feedback.join('; '); }
}
