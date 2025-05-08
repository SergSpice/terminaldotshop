import * as vscode from 'vscode';
import { client } from '../extension';
import { AddressItem } from '../models/address-item';
import { openReactWebview } from '../open-webview';
import Terminal from '@terminaldotshop/sdk';

export class AddressTreeDataProvider implements vscode.TreeDataProvider<AddressItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AddressItem | undefined | null | void> = new vscode.EventEmitter<AddressItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AddressItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private addressCache: Terminal.Address[] | null = null;
  private panel: vscode.WebviewPanel | undefined;

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

    return this.addressCache!.map(address => {
      const isSelected = address.id === selectedId;
      const item = new AddressItem(
        `${address.street1}, ${address.city}`,
        `${address.province}, ${address.country}`
      );
      item.contextValue = 'address';

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

  getCache() {
    return this.addressCache;
  }

  async fetchAddress() {
    const response = await client.operate().address.list();
    return response.data;
  }

  async createAddress(values: any) {
    try {
      const response = await client.operate().address.create(values);
      this.refresh();
      return [response, null]
    } catch (err) {
      return [null, err];
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    await client.operate().address.delete(addressId);
    this.refresh();
  }

  openWebview(context: vscode.ExtensionContext) {
    if (!this.panel) {
      this.panel = openReactWebview(
        'add-address',
        context,
        'Shipping Address',
        () => { },
        async (message: any, panel) => {
          switch (message.command) {
            case 'submitAddress':
              const [success, _] = await this.createAddress(message.payload);
              if (!!success) {
                panel.webview.postMessage({
                  type: 'success',
                  message: `Address added successfully!`
                });
              } else {
                panel.webview.postMessage({
                  type: 'error',
                  message: 'Failed to add address.'
                });
              }
              break;
            case 'close':
              this.panel?.dispose();
              this.panel = undefined;
          }
        }
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    } else {
      this.panel.reveal(vscode.ViewColumn.One);
    }
  }

  refresh(): void {
    this.addressCache = null;
    this._onDidChangeTreeData.fire();
  }

  getAddress() {
    if (this.addressCache) {
      const address = this.addressCache.find((address) => {
        return address.id === this.context.globalState.get('selectedAddressId');
      });

      if (!address) {
        return null;
      }

      return {
        id: this.context.globalState.get('selectedAddressId') as string,
        title: `${address.street1}, ${address.city}, ${address.province}, ${address.country}`

      }
    }
  }

  closePane() {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }
}
