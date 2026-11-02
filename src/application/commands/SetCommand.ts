import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class SetCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'set <id> <attr> <value>');
    args.expect(3);
    const shape = document.require(args.text(0));
    shape.setAttribute(args.text(1), args.text(2));
    return [`${shape.label()} updated: ${args.text(1)}=${JSON.stringify(args.text(2))}`];
  }
}
