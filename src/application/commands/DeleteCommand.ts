import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class DeleteCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'delete <id>');
    args.expect(1);
    const shape = document.require(args.text(0));
    document.delete(shape.getId());
    return [`${shape.label()} deleted`];
  }
}
