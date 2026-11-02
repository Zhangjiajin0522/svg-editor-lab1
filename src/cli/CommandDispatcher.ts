import type { Command } from '../application/Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import { Tokenizer } from './Tokenizer.ts';
import { CreateCommand } from '../application/commands/CreateCommand.ts';
import { DeleteCommand } from '../application/commands/DeleteCommand.ts';
import { MoveCommand } from '../application/commands/MoveCommand.ts';
import { ScaleCommand } from '../application/commands/ScaleCommand.ts';
import { SetCommand } from '../application/commands/SetCommand.ts';
import { GroupCommand } from '../application/commands/GroupCommand.ts';
import { UngroupCommand } from '../application/commands/UngroupCommand.ts';
import { AddToCommand } from '../application/commands/AddToCommand.ts';
import { FrontCommand } from '../application/commands/FrontCommand.ts';
import { BackCommand } from '../application/commands/BackCommand.ts';
import { InitCommand } from '../application/commands/InitCommand.ts';
import { ReadCommand } from '../application/commands/ReadCommand.ts';
import { SaveCommand } from '../application/commands/SaveCommand.ts';
import { CanvasCommand } from '../application/commands/CanvasCommand.ts';
import { UndoCommand } from '../application/commands/UndoCommand.ts';
import { RedoCommand } from '../application/commands/RedoCommand.ts';
import { TreeCommand } from '../application/commands/TreeCommand.ts';
import { ShowCommand } from '../application/commands/ShowCommand.ts';
import { HelpCommand } from '../application/commands/HelpCommand.ts';

export class CommandDispatcher {
  private readonly tokenizer = new Tokenizer();
  // TODO(plugin phase): inject command registrations instead of built-in entries.
  private readonly commands: ReadonlyMap<string, () => Command> = new Map([
    ['create', () => new CreateCommand()],
    ['delete', () => new DeleteCommand()],
    ['move', () => new MoveCommand()],
    ['scale', () => new ScaleCommand()],
    ['set', () => new SetCommand()],
    ['group', () => new GroupCommand()],
    ['ungroup', () => new UngroupCommand()],
    ['addto', () => new AddToCommand()],
    ['front', () => new FrontCommand()],
    ['back', () => new BackCommand()],
    ['init', () => new InitCommand()],
    ['read', () => new ReadCommand()],
    ['save', () => new SaveCommand()],
    ['canvas', () => new CanvasCommand()],
    ['undo', () => new UndoCommand()],
    ['redo', () => new RedoCommand()],
    ['tree', () => new TreeCommand()],
    ['show', () => new ShowCommand()],
    ['help', () => new HelpCommand()],
  ]);
  private readonly session: EditorSession;
  constructor(session: EditorSession) { this.session = session; }
  dispatch(line: string): { lines: string[]; failed: boolean } {
    try {
      const [name, ...args] = this.tokenizer.tokenize(line);
      if (name === undefined) return { lines: [], failed: false };
      const createCommand = this.commands.get(name);
      if (!createCommand) throw new Error(`unknown command: ${name}`);
      const lines = createCommand().execute(this.session, args);
      return { lines: lines.map(value => value.replace(/[\r\n]+/g, ' ')), failed: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unexpected failure';
      return { lines: [`error: ${message.replace(/[\r\n]+/g, ' ')}`], failed: true };
    }
  }
}
