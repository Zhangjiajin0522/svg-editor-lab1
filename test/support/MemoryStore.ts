import type { DocumentStore } from '../../src/application/DocumentStore.ts';
import type { SvgDocument } from '../../src/domain/SvgDocument.ts';

export class MemoryStore implements DocumentStore {
  private readonly documents = new Map<string, SvgDocument>();
  private failing = false;
  failWrites(value: boolean): void { this.failing = value; }
  read(path: string): { document: SvgDocument; warnings: string[] } {
    const document = this.documents.get(path);
    if (!document) throw new Error(`cannot read file: ${path}`);
    return { document: document.clone(), warnings: [] };
  }
  write(path: string, document: SvgDocument): void {
    if (this.failing) throw new Error(`cannot write file: ${path}`);
    this.documents.set(path, document.clone());
  }
}
