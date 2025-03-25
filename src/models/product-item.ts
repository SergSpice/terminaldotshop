import * as vscode from 'vscode';

export class ProductItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'group' | 'product',
    public readonly icon?: string | vscode.IconPath,
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = icon;
    }
  }
}
