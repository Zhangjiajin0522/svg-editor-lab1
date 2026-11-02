import type { SvgDocument } from '../domain/SvgDocument.ts';
import type { Shape } from '../domain/Shape.ts';

export class TreeFormatter {
  tree(document: SvgDocument, id?: string): string[] {
    const root = id === undefined ? document.getRoot() : document.require(id);
    const lines = [id === undefined ? `svg (${document.getWidth()}x${document.getHeight()})` : root.summary()];
    this.children(root, '', lines);
    return lines;
  }
  private children(shape: Shape, prefix: string, lines: string[]): void {
    const children = shape.getChildren();
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${child.summary()}`);
      this.children(child, prefix + (last ? '    ' : '│   '), lines);
    });
  }
  show(document: SvgDocument, id: string): string[] {
    const shape = document.require(id), parent = document.parentOf(shape);
    const attributes = Object.entries(shape.getAttributes()).filter(([key]) => key !== 'id').map(([key, value]) => `${key}=${value}`);
    if (shape.getText() !== undefined) attributes.push(`text=${JSON.stringify(shape.getText())}`);
    return [`${shape.label()}  parent=${parent === document.getRoot() ? 'svg' : parent.label()}`, ...attributes.map(a => `  ${a}`)];
  }
}
