import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class GroupCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'group <newGid> <id1> [id2…]');
    args.expect(2, Infinity);
    const group = document.group(args.text(0), values.slice(1));
    return [`${group.label()} created with ${group.getChildren().length} children`];
  }
}
