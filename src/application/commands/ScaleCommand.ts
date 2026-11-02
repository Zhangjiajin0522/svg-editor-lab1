import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';

export class ScaleCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[]): string[] {
    const args = new CommandArguments(values, 'scale <id> <factor>');
    args.expect(2);
    const shape = document.require(args.text(0)), factor = args.number(1, 'scale factor');
    shape.scale(factor);
    return [`${shape.label()} scaled by ${factor}`];
  }
}
