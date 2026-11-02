import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class MoveCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'move <id> <dx> <dy>');
    args.expect(3);
    const shape = document.require(args.text(0)), dx = args.number(1, 'dx'), dy = args.number(2, 'dy');
    shape.move(dx, dy);
    return [`${shape.label()} moved by (${dx},${dy})`];
  }
}
