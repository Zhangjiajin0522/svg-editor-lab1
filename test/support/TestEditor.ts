import assert from 'node:assert/strict';
import { ShapeFactory } from '../../src/domain/ShapeFactory.ts';
import { EditorSession } from '../../src/application/EditorSession.ts';
import { CommandDispatcher } from '../../src/cli/CommandDispatcher.ts';
import { SvgCodec } from '../../src/infrastructure/SvgCodec.ts';
import { MemoryStore } from './MemoryStore.ts';

export class TestEditor {
  readonly store = new MemoryStore();
  readonly factory = new ShapeFactory();
  readonly session = new EditorSession(this.store, this.factory);
  readonly dispatcher = new CommandDispatcher(this.session);
  readonly codec = new SvgCodec(this.factory);
  ok(command: string): string[] {
    const result = this.dispatcher.dispatch(command);
    assert.equal(result.failed, false, `${command}: ${result.lines.join('\n')}`);
    return result.lines;
  }
  error(command: string, expected: RegExp): void {
    const result = this.dispatcher.dispatch(command);
    assert.equal(result.failed, true, command);
    assert.equal(result.lines.length, 1);
    assert.match(result.lines[0]!, expected);
  }
  snapshot(): string { return this.codec.encode(this.session.getDocument()); }
  setup(): void {
    this.ok('init'); this.ok('create g scene'); this.ok('create g nested in scene');
    this.ok('create rect a 1 2 3 4 red in nested');
    this.ok('create circle b 5 6 7 in scene');
    this.ok('create text t 9 10 "hello world" in scene');
  }
}
