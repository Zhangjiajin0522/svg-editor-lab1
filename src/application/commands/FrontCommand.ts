import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class FrontCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'front <id>');
    args.expect(1);
    document.reorder(args.text(0), true);
    return [`${document.require(args.text(0)).label()} moved to front`];
  }
}
