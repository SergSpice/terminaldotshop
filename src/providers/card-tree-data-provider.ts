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
      this.cardCache = await this.fetchCards();
    }
    const selectedId = this.context.globalState.get('selectedCardId');

    return this.cardCache.map(card => {
      const isSelected = card.id === selectedId;
      const item = new CardItem(
        `${card.brand.toUpperCase()} ending in ${card.last4}`,
        `${card.expiration.month}/${card.expiration.year}`
      );

      item.command = {
        command: 'cardView.selectCard',
        title: 'Select Card',
        arguments: [card.id]
      };

      if (isSelected) {
        item.iconPath = new vscode.ThemeIcon('pass-filled');
      } else {
        item.iconPath = new vscode.ThemeIcon('circle-large-outline');
      }
      return item;
    });
  }

  async fetchCards() {
    console.log('Fetching cards');
    const response = await client.card.list();
    return response.data;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
