import { createInterface } from 'node:readline';
import { ShapeFactory } from '../domain/ShapeFactory.ts';
import { EditorSession } from '../application/EditorSession.ts';
import { FileDocumentStore } from '../infrastructure/FileDocumentStore.ts';
import { SvgCodec } from '../infrastructure/SvgCodec.ts';
import { CommandDispatcher } from './CommandDispatcher.ts';

export class Main {
  run(): void {
    const factory = new ShapeFactory();
    const dispatcher = new CommandDispatcher(new EditorSession(new FileDocumentStore(new SvgCodec(factory)), factory));
    const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const input = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive, crlfDelay: Infinity });
    let failed = false;
    if (interactive) {
      process.stdout.write("svg-editor 0.1 — type 'help' for commands\n");
      input.setPrompt('svg> '); input.prompt();
    }
    input.on('line', line => {
      const result = dispatcher.dispatch(line);
      if (result.lines.length) process.stdout.write(result.lines.join('\n') + '\n');
      failed ||= result.failed;
      if (interactive) input.prompt();
    });
    input.on('close', () => { if (!interactive && failed) process.exitCode = 1; });
    input.on('SIGINT', () => input.close());
  }
}
new Main().run();
