import * as vscode from 'vscode';
import { CoffeeItem } from '../models/coffee-item';

export class CoffeeTreeDataProvider implements vscode.TreeDataProvider<CoffeeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CoffeeItem | undefined | null | void> = new vscode.EventEmitter<CoffeeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CoffeeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  // Mock coffee products
  private coffees = [
    { name: "Espresso", price: "$3" },
    { name: "Latte", price: "$4" },
    { name: "Cappuccino", price: "$4" },
    { name: "Flat White", price: "$4.5" },
    { name: "Cold Brew", price: "$5" }
  ];

  getTreeItem(element: CoffeeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<CoffeeItem[]> {
    const items = this.coffees.map(coffee => new CoffeeItem(coffee.name, coffee.price));
    return Promise.resolve(items);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
