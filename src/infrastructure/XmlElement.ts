/** Adapter for fast-xml-parser's ordered representation. */
export class XmlElement {
  private readonly tag: string;
  private readonly attributes: Readonly<Record<string, string>>;
  private readonly children: XmlElement[] = [];
  private text = '';
  constructor(node: Record<string, unknown>) {
    const tag = Object.keys(node).find(key => key !== ':@');
    if (!tag || !Array.isArray(node[tag])) throw new Error('invalid XML element');
    this.tag = tag;
    this.attributes = (node[':@'] ?? {}) as Record<string, string>;
    for (const entry of node[tag] as Record<string, unknown>[]) {
      if ('#text' in entry) this.text += String(entry['#text']);
      else this.children.push(new XmlElement(entry));
    }
  }
  getTag(): string { return this.tag; }
  getAttributes(): Readonly<Record<string, string>> { return this.attributes; }
  getChildren(): readonly XmlElement[] { return [...this.children]; }
  getText(): string { return this.text; }
  walk(): XmlElement[] { return [this, ...this.children.flatMap(child => child.walk())]; }
}
