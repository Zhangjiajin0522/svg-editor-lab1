import { SvgDocument } from '../domain/SvgDocument.ts';
import { ShapeFactory } from '../domain/ShapeFactory.ts';
import type { DocumentStore } from './DocumentStore.ts';
import type { EditCommand } from './EditCommand.ts';
import { History } from './History.ts';

export class EditorSession {
  private document?: SvgDocument;
  private path?: string;
  private readonly factory: ShapeFactory;
  private readonly store: DocumentStore;
  private readonly history = new History();
  constructor(store: DocumentStore, factory: ShapeFactory) { this.store = store; this.factory = factory; }
  getFactory(): ShapeFactory { return this.factory; }
  getDocument(): SvgDocument {
    if (!this.document) throw new Error("no document. use 'init' or 'read' first");
    return this.document;
  }
  init(width: number, height: number): void {
    const document = new SvgDocument(width, height);
    this.document = document; this.path = undefined; this.history.barrier();
  }
  read(path: string): string[] {
    const result = this.store.read(path);
    this.document = result.document; this.path = path; this.history.barrier();
    return [...result.warnings, `read ${path} (${this.document.all().length} elements)`];
  }
  save(path?: string): string[] {
    const document = this.getDocument(), target = path ?? this.path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    this.store.write(target, document);
    this.path = target; this.history.barrier();
    return [`saved to ${target} (${document.all().length} elements)`];
  }
  resize(width: number, height: number): void {
    const document = this.getDocument().clone();
    document.resize(width, height);
    this.document = document; this.history.barrier();
  }
  acceptEdit(command: EditCommand, document: SvgDocument): void {
    this.document = document; this.history.record(command);
  }
  undo(): string[] {
    this.getDocument();
    const result = this.history.undo(); this.document = result.document;
    return [result.feedback];
  }
  redo(): string[] {
    this.getDocument();
    const result = this.history.redo(); this.document = result.document;
    return [result.feedback];
  }
}
