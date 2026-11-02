import { Command } from '../Command.ts';
import { CommandArguments } from '../CommandArguments.ts';
import type { EditorSession } from '../EditorSession.ts';

export class HelpCommand extends Command {
  override execute(_session: EditorSession, values: readonly string[]): string[] {
    new CommandArguments(values, 'help').expect(0);
    return [
      'init [w] [h] | read <file.svg> | save [file.svg] | canvas [w] [h]',
      'create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]',
      'create circle <id> <cx> <cy> <r> [fill] [in <containerId>]',
      'create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]',
      'create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]',
      'create text <id> <x> <y> "content" [in <containerId>]',
      'create g <id> [in <containerId>]',
      'delete <id> | move <id> <dx> <dy> | scale <id> <factor>',
      'set <id> <attr> <value>',
      'group <newGid> <id1> [id2…] | ungroup <gid> | addto <gid> <id>',
      'front <id> | back <id> | tree [id] | show <id> | undo | redo | help',
      'Common set attributes: fill, stroke, stroke-width; plus shape geometry and text content.',
      'Double-quote arguments containing spaces; # at line start is a comment. Ctrl-D exits.',
    ];
  }
}
