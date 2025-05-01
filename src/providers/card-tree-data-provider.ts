import * as vscode from 'vscode';
import { client } from '../extension';
import { CardItem } from '../models/card-item';
import { openReactWebview } from '../open-webview';
import Terminal from '@terminaldotshop/sdk';

export class CardTreeDataProvider implements vscode.TreeDataProvider<CardItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CardItem | undefined | null | void> = new vscode.EventEmitter<CardItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CardItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private cardCache: Terminal.Card[] | null = null;
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) { }

  getTreeItem(element: CardItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<CardItem[]> {
    if (this.cardCache === null) {
      this.cardCache = await this.fetchCards();
    }
    const selectedId = this.context.globalState.get('selectedCardId');

    return this.cardCache!.map(card => {
      const isSelected = card.id === selectedId;
      const item = new CardItem(
        `${card.brand.toUpperCase()} ending in ${card.last4}`,
        `${card.expiration.month}/${card.expiration.year}`
      );
      item.contextValue = 'card';

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
    const response = await client!.card.list();
    return response.data;
  }

  async collectCard() {
    const response = await client!.card.collect();
    return response.data;
  }

  async deleteCard(cardId: string) {
    await client!.card.delete(cardId);
    this.refresh();
  }

  async openWebview(context: vscode.ExtensionContext) {
    if (!this.panel) {
      const res = await this.collectCard();
      this.panel = openReactWebview(
        `add-card?url=${res.url}`,
        context,
        'Payment Information',
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    } else {
      this.panel.reveal(vscode.ViewColumn.One);
    }
  }

  getSelectedCard() {
    if (this.cardCache) {
      const selected = this.cardCache.find((card) => {
        return card.id === this.context.globalState.get('selectedCardId');
      });

      if (!selected) {
        return null;
      }

      return {
        id: this.context.globalState.get('selectedCardId') as string,
        number: `${selected.brand.toUpperCase()} ending in ${selected.last4}`,
        expiration: `${selected.expiration.month}/${selected.expiration.year}`,
      }
    }
  }

  refresh(): void {
    this.cardCache = null;
    this._onDidChangeTreeData.fire();
  }
}
