import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class UngroupCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'ungroup <gid>');
    args.expect(1);
    const id = args.text(0), count = document.ungroup(id);
    return [`g#${id} ungrouped (${count} children promoted)`];
  }
}
