import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class AddToCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'addto <gid> <id>');
    args.expect(2);
    document.addTo(args.text(0), args.text(1));
    return [`${document.require(args.text(1)).label()} moved into g#${args.text(0)}`];
  }
}
