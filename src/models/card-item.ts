import * as vscode from 'vscode';

export class CardItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
  ) {
    super(label);
    this.description = description;
  }
}

