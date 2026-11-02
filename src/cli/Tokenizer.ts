export class Tokenizer {
  tokenize(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let current = '', quoted = false, active = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      if (char === '"') { quoted = !quoted; active = true; }
      else if (quoted && char === '\\' && ['"', '\\'].includes(line[i + 1] ?? '')) {
        current += line[++i]; active = true;
      } else if (!quoted && /\s/u.test(char)) {
        if (active) { tokens.push(current); current = ''; active = false; }
      } else { current += char; active = true; }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (active) tokens.push(current);
    return tokens;
  }
}
