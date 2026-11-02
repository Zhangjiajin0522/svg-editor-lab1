import ts from 'typescript';

/** The compiler API also works with offline editor-bundled TypeScript. */
class Build {
  run(): void {
    const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
    if (config.error) { this.report([config.error]); return; }
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
    const program = ts.createProgram(parsed.fileNames, parsed.options);
    const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
    if (diagnostics.length) { this.report(diagnostics); return; }
    this.report(program.emit().diagnostics);
  }
  private report(diagnostics: readonly ts.Diagnostic[]): void {
    if (!diagnostics.length) return;
    process.stderr.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: name => name,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => '\n',
    }));
    process.exitCode = 1;
  }
}
new Build().run();
