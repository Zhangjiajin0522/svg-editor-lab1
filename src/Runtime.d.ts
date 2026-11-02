/** Minimal typed ports for the Node APIs used by this CLI.
 * These declarations keep compilation independent of a particular @types/node
 * release. Integration tests exercise the actual platform implementations.
 */
declare namespace SvgRuntime {
  interface Input { readonly isTTY?: boolean; }
  interface Output { readonly isTTY?: boolean; write(chunk: string): boolean; }
  interface Readline {
    setPrompt(prompt: string): void;
    prompt(): void;
    close(): void;
    on(event: 'line', listener: (line: string) => void): this;
    on(event: 'close' | 'SIGINT', listener: () => void): this;
  }
}
declare const process: {
  readonly stdin: SvgRuntime.Input;
  readonly stdout: SvgRuntime.Output;
  exitCode?: number;
};
declare module 'node:readline' {
  export function createInterface(options: {
    input: SvgRuntime.Input; output: SvgRuntime.Output; terminal: boolean; crlfDelay: number;
  }): SvgRuntime.Readline;
}
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function writeFileSync(path: string, data: string, options: { encoding: 'utf8'; flag: 'wx' }): void;
  export function renameSync(oldPath: string, newPath: string): void;
  export function unlinkSync(path: string): void;
}
declare module 'node:path' {
  export function dirname(path: string): string;
  export function basename(path: string): string;
  export function join(...paths: string[]): string;
}
declare module 'node:crypto' {
  export function randomUUID(): string;
}
declare module 'fast-xml-parser' {
  export class XMLParser {
    constructor(options: {
      preserveOrder: boolean; ignoreAttributes: boolean; attributeNamePrefix: string;
      parseTagValue: boolean; parseAttributeValue: boolean; trimValues: boolean;
      ignoreDeclaration: boolean; ignorePiTags: boolean; processEntities: boolean; htmlEntities: boolean;
    });
    parse(xml: string): unknown;
  }
  export const XMLValidator: {
    validate(xml: string): true | { err: { msg: string; code: string; line: number; col: number } };
  };
}
