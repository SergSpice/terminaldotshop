interface VSCodeAPI {
  postMessage: (message: any) => void;
  setState: (state: any) => void;
  getState: () => any;
}

declare global {
  interface Window {
    vscode?: VSCodeAPI;
  }
}

// Safely acquire only once
if (!window.vscode) {
  window.vscode = acquireVsCodeApi();
}

export default window.vscode!;
