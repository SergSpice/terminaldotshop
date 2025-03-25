import * as vscode from 'vscode';
import { client } from '../extension';
import Terminal from '@terminaldotshop/sdk';
import { CardItem } from '../models/card-item';

export class CardTreeDataProvider implements vscode.TreeDataProvider<CardItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CardItem | undefined | null | void> = new vscode.EventEmitter<CardItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CardItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private cardCache: Terminal.Card[] | null = null;

  constructor(private context: vscode.ExtensionContext) { }

  getTreeItem(element: CardItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<CardItem[]> {
    if (this.cardCache === null) {
      this.cardCache = await this.fetchAddress();
    }

    return this.cardCache.map(card => {
      return new CardItem(
        `${card.brand.toUpperCase()} ending in ${card.last4}`,
        `${card.expiration.month}/${card.expiration.year}`
      );
    });

  }

  async fetchAddress() {
    console.log('Fetching cards');
    const response = await client.card.list();
    return response.data;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
