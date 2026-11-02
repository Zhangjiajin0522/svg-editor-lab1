import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { SvgDocument } from '../domain/SvgDocument.ts';
import { ShapeFactory } from '../domain/ShapeFactory.ts';
import { Group } from '../domain/Group.ts';
import { Numbers } from '../domain/Numbers.ts';
import type { Shape } from '../domain/Shape.ts';
import { XmlElement } from './XmlElement.ts';
import { XmlText } from './XmlText.ts';

export class SvgCodec {
  private readonly factory: ShapeFactory;
  constructor(factory: ShapeFactory) { this.factory = factory; }
  decode(xml: string): { document: SvgDocument; warnings: string[] } {
    try { return this.parse(xml); }
    catch (error) { throw new Error(`invalid SVG: ${error instanceof Error ? error.message : 'parse failure'}`); }
  }
  private parse(xml: string): { document: SvgDocument; warnings: string[] } {
    XmlText.assertValid(xml);
    const markup = xml.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, '');
    if (/<!DOCTYPE|<!ENTITY/i.test(markup)) throw new Error('DOCTYPE and custom entities are not supported');
    if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/.test(markup)) throw new Error('invalid XML entity');
    for (const match of markup.matchAll(/&#(x[\da-fA-F]+|\d+);/g)) {
      const code = match[1]!.startsWith('x') ? Number.parseInt(match[1]!.slice(1), 16) : Number(match[1]);
      if (code > 0x10ffff) throw new Error('invalid XML character reference');
      XmlText.assertValid(String.fromCodePoint(code));
    }
    const validation = XMLValidator.validate(xml);
    if (validation !== true) throw new Error(validation.err.msg);
    const parser = new XMLParser({
      preserveOrder: true, ignoreAttributes: false, attributeNamePrefix: '',
      parseTagValue: false, parseAttributeValue: false, trimValues: false,
      ignoreDeclaration: true, ignorePiTags: true, processEntities: true,
    });
    const nodes = (parser.parse(xml) as Record<string, unknown>[]).filter(node => !('#text' in node && !String(node['#text']).trim()));
    if (nodes.length !== 1) throw new Error('expected one svg root element');
    const root = new XmlElement(nodes[0]!);
    if (root.getTag() !== 'svg') throw new Error('expected svg root element');
    if (root.getText().trim()) throw new Error('unexpected text inside svg');
    const attributes = root.getAttributes();
    if (attributes.xmlns !== undefined && attributes.xmlns !== 'http://www.w3.org/2000/svg') throw new Error('unsupported SVG namespace');
    const width = this.length(attributes.width ?? '800', 'width');
    const height = this.length(attributes.height ?? '600', 'height');
    const document = new SvgDocument(width, height);
    if (attributes.viewBox !== undefined) {
      const box = attributes.viewBox.trim().split(/[\s,]+/).map(value => Numbers.parse(value, 'viewBox'));
      if (box.length !== 4 || box[0] !== 0 || box[1] !== 0 || box[2] !== width || box[3] !== height) {
        throw new Error('viewBox must match 0 0 width height');
      }
    }
    for (const [name, value] of Object.entries(attributes)) {
      if (!['xmlns', 'width', 'height', 'viewBox'].includes(name)) document.getRoot().setAttribute(name, value);
    }
    const reserved = new Set<string>();
    for (const element of root.getChildren().flatMap(child => child.walk())) {
      const id = element.getAttributes().id;
      if (!id) continue;
      if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
      reserved.add(id);
    }
    const warnings: string[] = [];
    for (const element of root.getChildren()) this.load(element, document, undefined, reserved, warnings);
    return { document, warnings };
  }
  private length(value: string, name: string): number {
    return Numbers.parse(value.replace(/px$/, ''), name);
  }
  private load(element: XmlElement, document: SvgDocument, parentId: string | undefined, reserved: Set<string>, warnings: string[]): void {
    const attributes = element.getAttributes(), tag = element.getTag();
    let id = attributes.id;
    if (!id) {
      let index = 1;
      while (reserved.has(`${tag}${index}`)) index++;
      id = `${tag}${index}`; reserved.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
    }
    const shape = this.factory.fromAttributes(tag, id, attributes, element.getText());
    if (element.getChildren().length && !(shape instanceof Group)) throw new Error(`children not allowed in <${tag}>`);
    if (shape.getText() === undefined && element.getText().trim()) throw new Error(`unexpected text inside <${tag}>`);
    document.insert(shape, parentId);
    for (const child of element.getChildren()) this.load(child, document, id, reserved, warnings);
  }
  encode(document: SvgDocument): string {
    const width = document.getWidth(), height = document.getHeight();
    const styles = Object.entries(document.getRoot().getAttributes()).filter(([name]) => name !== 'id')
      .map(([name, value]) => ` ${name}="${XmlText.escape(value)}"`).join('');
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"${styles}>`];
    for (const shape of document.getRoot().getChildren()) this.serialize(shape, '  ', lines);
    lines.push('</svg>');
    return lines.join('\n') + '\n';
  }
  private serialize(shape: Shape, indent: string, lines: string[]): void {
    const attrs = Object.entries(shape.getAttributes()).map(([key, value]) => `${key}="${XmlText.escape(value)}"`).join(' ');
    const children = shape.getChildren(), text = shape.getText();
    if (text !== undefined) lines.push(`${indent}<${shape.getTag()} ${attrs}>${XmlText.escape(text)}</${shape.getTag()}>`);
    else if (!children.length) lines.push(`${indent}<${shape.getTag()} ${attrs}/>`);
    else {
      lines.push(`${indent}<${shape.getTag()} ${attrs}>`);
      for (const child of children) this.serialize(child, indent + '  ', lines);
      lines.push(`${indent}</${shape.getTag()}>`);
    }
  }
}
