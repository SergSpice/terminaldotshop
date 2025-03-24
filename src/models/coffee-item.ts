import * as vscode from 'vscode';

export class CoffeeItem extends vscode.TreeItem {
  description?: string | boolean | undefined;

  constructor(
    public readonly label: string,
    public readonly price: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = price;
  }
}
