import * as vscode from 'vscode';
import { client } from '../extension';
import Terminal from '@terminaldotshop/sdk';
import { AddressItem } from '../models/address-item';

export class AddressTreeDataProvider implements vscode.TreeDataProvider<AddressItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AddressItem | undefined | null | void> = new vscode.EventEmitter<AddressItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AddressItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private addressCache: Terminal.Address[] | null = null;

  constructor(
    private context: vscode.ExtensionContext
  ) { }

  getTreeItem(element: AddressItem): vscode.TreeItem {
    return element;
  }

  async getChildren() {
    if (this.addressCache === null) {
      this.addressCache = await this.fetchAddress();
    }
    const selectedId = this.context.globalState.get('selectedAddressId');

    return this.addressCache.map(address => {
      const isSelected = address.id === selectedId;
      const item = new AddressItem(
        `${address.street1}, ${address.city}`,
        `${address.province}, ${address.country}`
      );

      // Attach a select command
      item.command = {
        command: 'addressView.selectAddress',
        title: 'Select Address',
        arguments: [address.id]
      };

      if (isSelected) {
        item.iconPath = new vscode.ThemeIcon('pass-filled');
      } else {
        item.iconPath = new vscode.ThemeIcon('circle-large-outline');
      }

      return item;
    });
  }

  async fetchAddress() {
    console.log('Fetching address');
    const response = await client.address.list();
    return response.data;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
