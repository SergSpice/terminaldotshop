import * as vscode from 'vscode';
import { ThemeProvider } from './theme-provider';

export function getWebViewContent(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  path: string,
) {

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'react-btw', 'dist', 'assets', 'index.js')
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'react-btw', 'dist', 'assets', 'index.css')
  );

  const initialPath = path;
  const isDarkTheme = ThemeProvider.getInstance().isDarkTheme();

  return `
    <!DOCTYPE html>
    <html lang="en" class="${isDarkTheme ? 'dark' : ''}">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
    </head>
      <body>
        <div id="root"></div>
        <script>
          window.vscode = acquireVsCodeApi();
          window.initialTheme = ${isDarkTheme};
        </script>
        <script src="${scriptUri}"></script>
        <script>
          window.location.hash = '${initialPath}'; // Example: '#/add-address'
        </script>
      </body>
    </html>
  `;
}
