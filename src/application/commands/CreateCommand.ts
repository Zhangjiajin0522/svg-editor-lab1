import { EditCommand } from '../EditCommand.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { SvgDocument } from '../../domain/SvgDocument.ts';
import type { ShapeFactory } from '../../domain/ShapeFactory.ts';

export class CreateCommand extends EditCommand {
  protected override edit(document: SvgDocument, values: readonly string[], factory: ShapeFactory): string[] {
    const args = new CommandArguments(values, 'create <type> <id> [params…] [in <containerId>]');
    args.expect(2, Infinity);
    const params = [...values.slice(2)];
    let parentId: string | undefined;
    if (params.length >= 2 && params.at(-2) === 'in') { parentId = params.pop()!; params.pop(); }
    const shape = factory.create(args.text(0), args.text(1), params);
    document.insert(shape, parentId);
    return [`${shape.label()} created${parentId === undefined ? '' : ` in g#${parentId}`}`];
  }
}
