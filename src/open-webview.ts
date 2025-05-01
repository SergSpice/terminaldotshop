import * as vscode from 'vscode';
import { getWebViewContent } from './web-view-content';
import { ThemeProvider } from './theme-provider';

export function openReactWebview(
  path: string,
  context: vscode.ExtensionContext,
  tabTitle: string,
  onInit?: (panel: vscode.WebviewPanel) => void,
  onMessageReceived?: (message: any, panel: vscode.WebviewPanel) => void,
) {
  const panel = vscode.window.createWebviewPanel(
    'reactForm',
    tabTitle,
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  panel.webview.html = getWebViewContent(panel.webview, context, path);

  // Listen for theme changes
  const themeProvider = ThemeProvider.getInstance();
  const themeDisposable = themeProvider.onDidChangeTheme((isDark) => {
    panel.webview.postMessage({
      type: 'themeChanged',
      isDark
    });
  });

  panel.webview.onDidReceiveMessage(async (message) => {
    onMessageReceived?.(message, panel);
  });

  onInit?.(panel);

  // Clean up when the panel is disposed
  panel.onDidDispose(() => {
    themeDisposable.dispose();
  });

  return panel;
}
