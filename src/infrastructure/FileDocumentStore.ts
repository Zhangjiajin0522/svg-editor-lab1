import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore } from '../application/DocumentStore.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { SvgCodec } from './SvgCodec.ts';

export class FileDocumentStore implements DocumentStore {
  private readonly codec: SvgCodec;
  constructor(codec: SvgCodec) { this.codec = codec; }
  read(path: string): { document: SvgDocument; warnings: string[] } {
    let xml: string;
    try { xml = readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(xml);
  }
  write(path: string, document: SvgDocument): void {
    const xml = this.codec.encode(document);
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    let created = false;
    try {
      writeFileSync(temporary, xml, { encoding: 'utf8', flag: 'wx' }); created = true;
      renameSync(temporary, path);
    } catch {
      if (created) { try { unlinkSync(temporary); } catch { /* Original write failure takes precedence. */ } }
      throw new Error(`cannot write file: ${path}`);
    }
  }
}
