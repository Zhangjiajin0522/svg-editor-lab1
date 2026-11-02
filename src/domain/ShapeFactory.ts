import { Shape } from './Shape.ts';
import { Rect } from './Rect.ts';
import { Circle } from './Circle.ts';
import { Ellipse } from './Ellipse.ts';
import { Line } from './Line.ts';
import { TextShape } from './TextShape.ts';
import { Group } from './Group.ts';
import { Numbers } from './Numbers.ts';

interface ShapeDefinition {
  readonly parameters: readonly string[];
  readonly paint?: string;
  readonly build: (id: string, values: readonly string[]) => Shape;
}

export class ShapeFactory {
  // TODO(plugin phase): inject provider registrations instead of built-in entries.
  private readonly definitions: ReadonlyMap<string, ShapeDefinition> = new Map([
    ['rect', { parameters: ['x', 'y', 'width', 'height'], paint: 'fill',
      build: (id, p) => new Rect(id, this.number(p, 0), this.number(p, 1), this.number(p, 2), this.number(p, 3)) }],
    ['circle', { parameters: ['cx', 'cy', 'r'], paint: 'fill',
      build: (id, p) => new Circle(id, this.number(p, 0), this.number(p, 1), this.number(p, 2)) }],
    ['ellipse', { parameters: ['cx', 'cy', 'rx', 'ry'], paint: 'fill',
      build: (id, p) => new Ellipse(id, this.number(p, 0), this.number(p, 1), this.number(p, 2), this.number(p, 3)) }],
    ['line', { parameters: ['x1', 'y1', 'x2', 'y2'], paint: 'stroke',
      build: (id, p) => new Line(id, this.number(p, 0), this.number(p, 1), this.number(p, 2), this.number(p, 3)) }],
    ['text', { parameters: ['x', 'y', 'text'],
      build: (id, p) => new TextShape(id, this.number(p, 0), this.number(p, 1), p[2]!) }],
    ['g', { parameters: [], build: id => new Group(id) }],
  ]);
  private number(values: readonly string[], index: number): number {
    return Numbers.parse(values[index]!, `parameter ${index + 1}`);
  }
  private definition(type: string): ShapeDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
  create(type: string, id: string, values: readonly string[]): Shape {
    const definition = this.definition(type), count = definition.parameters.length;
    if (values.length !== count && !(definition.paint && values.length === count + 1)) {
      throw new Error(`usage: create ${type} <id> ${definition.parameters.map(p => `<${p}>`).join(' ')}${definition.paint ? ` [${definition.paint}]` : ''} [in <containerId>]`);
    }
    const shape = definition.build(id, values);
    if (values.length > count) shape.setAttribute(definition.paint!, values[count]!);
    return shape;
  }
  fromAttributes(type: string, id: string, attributes: Readonly<Record<string, string>>, text = ''): Shape {
    const definition = this.definition(type);
    const values = definition.parameters.map(name => name === 'text' ? text : attributes[name] ?? '0');
    const shape = definition.build(id, values);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'id' || definition.parameters.includes(key)) continue;
      shape.setAttribute(key, value);
    }
    return shape;
  }
}
