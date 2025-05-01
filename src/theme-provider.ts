import * as vscode from 'vscode';

export class ThemeProvider {
  private static instance: ThemeProvider;
  private _onDidChangeTheme = new vscode.EventEmitter<boolean>();
  readonly onDidChangeTheme = this._onDidChangeTheme.event;

  private constructor() {
    // Listen to VSCode theme changes
    vscode.window.onDidChangeActiveColorTheme(() => {
      this._onDidChangeTheme.fire(this.isDarkTheme());
    });
  }

  public static getInstance(): ThemeProvider {
    if (!ThemeProvider.instance) {
      ThemeProvider.instance = new ThemeProvider();
    }
    return ThemeProvider.instance;
  }

  public isDarkTheme(): boolean {
    return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
  }
} 
