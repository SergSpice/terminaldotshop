import * as vscode from 'vscode';

export class ProductItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'group' | 'product',
    public readonly icon?: string | vscode.IconPath,
    public readonly description?: string,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = icon;
    }
    this.description = description;
    this.tooltip = tooltip;
    if (command) {
      this.command = command;
      this.contextValue = 'product';
      this.id = command.arguments?.[0];
    }
  }
}
