import * as vscode from 'vscode';
import { CoffeeTreeDataProvider } from './providers/coffee-tree-data-provider';
import Terminal from '@terminaldotshop/sdk';
import * as dotenv from 'dotenv';
import { AddressTreeDataProvider } from './providers/address-tree-data-provider';
import { CardTreeDataProvider } from './providers/card-tree-data-provider';
import { OrderHistoryProvider } from './providers/order-history-tree-data-provider';

dotenv.config({
  path: __dirname + '/../.env'
});

export const client = new Terminal({
  environment: 'dev',
});

export async function activate(context: vscode.ExtensionContext) {
  // NOTE: Coffeee Inventory View
  const coffeeProvider = new CoffeeTreeDataProvider(context);
  vscode.window.createTreeView('productView', { treeDataProvider: coffeeProvider });

  // NOTE: Address View
  const addressProvider = new AddressTreeDataProvider(context);
  vscode.window.createTreeView('addressView', { treeDataProvider: addressProvider });
  context.subscriptions.push(
    vscode.commands.registerCommand('addressView.selectAddress', async (addressId: string) => {
      await context.globalState.update('selectedAddressId', addressId);
      const selected = addressProvider.getAddress();
      if (selected) {
        coffeeProvider.setSelectedAddress(selected.id, selected.title);
        coffeeProvider.refreshWebview();
      }
      addressProvider.refresh();
    }),
    vscode.commands.registerCommand('addressView.refresh', () => {
      addressProvider.refresh();
      vscode.window.showInformationMessage('refresh clicked');
    }),
    vscode.commands.registerCommand('addressView.addAddress', () => {
      addressProvider.openWebview(context);
    }),
    vscode.commands.registerCommand('addressView.delete', (item) => {
      addressProvider.deleteAddress(item.command.arguments[0]);
    }),
  );

  // NOTE: Card View
  const cardProvider = new CardTreeDataProvider(context);
  vscode.window.createTreeView('cardView', { treeDataProvider: cardProvider });
  context.subscriptions.push(
    vscode.commands.registerCommand('cardView.selectCard', async (cardId: string) => {
      await context.globalState.update('selectedCardId', cardId);
      const selected = cardProvider.getSelectedCard();
      if (selected) {
        coffeeProvider.setSelectedCard(selected.id, selected.number, selected.expiration);
        coffeeProvider.refreshWebview();
      }
      cardProvider.refresh();
    }),
    vscode.commands.registerCommand('cardView.addCard', async () => {
      cardProvider.openWebview(context);
    }),
    vscode.commands.registerCommand('cardView.refresh', async () => {
      cardProvider.refresh();
    }),
    vscode.commands.registerCommand('cardView.delete', (item) => {
      cardProvider.deleteCard(item.command.arguments[0]);
    }),
  );

  // NOTE: Order View
  const orderProvider = new OrderHistoryProvider(context);
  vscode.window.createTreeView('orderView', { treeDataProvider: orderProvider });
  context.subscriptions.push(
    vscode.commands.registerCommand('orderHistory.trackPackage', (orderItem) => {
      const trackingUrl = orderItem?.order.tracking.url;
      if (trackingUrl) {
        vscode.env.openExternal(vscode.Uri.parse(trackingUrl));
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('productView.removeFromCart', (product: any) => {
      if (!coffeeProvider.isPanelOpen()) {
        const address = addressProvider.getAddress();
        const card = cardProvider.getSelectedCard();
        if (address) {
          coffeeProvider.setSelectedAddress(address.id, address.title);
        }
        if (card) {
          coffeeProvider.setSelectedCard(
            card.id,
            card.number,
            card.expiration,
          );
        }
        coffeeProvider.openWebview(context, () => {
          orderProvider.refresh()
        });
      } else {
        coffeeProvider.removeProductFromCart(product.id);
        coffeeProvider.refreshWebview();
      }
    }),
    vscode.commands.registerCommand('productView.addToCart', (product: any) => {
      if (typeof product === 'string') {
        return;
      }
      if (!coffeeProvider.isPanelOpen()) {
        const address = addressProvider.getAddress();
        const card = cardProvider.getSelectedCard();
        if (address) {
          coffeeProvider.setSelectedAddress(address.id, address.title);
        }
        if (card) {
          coffeeProvider.setSelectedCard(
            card.id,
            card.number,
            card.expiration,
          );
        }
        coffeeProvider.openWebview(context, () => {
          orderProvider.refresh();
        });
      } else {
        coffeeProvider.addProductToCart(product.id, product.label, product.tooltip);
        coffeeProvider.refreshWebview();
        coffeeProvider.reveal();
      }
    }),
  );



  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('terminal-shop.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from terminal-shop!');
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
