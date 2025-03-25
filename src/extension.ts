// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
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
  environment: 'production',
});


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // NOTE: Coffeee Inventory View
  const coffeeProvider = new CoffeeTreeDataProvider(context);
  vscode.window.createTreeView('productView', { treeDataProvider: coffeeProvider });

  // NOTE: Address View
  const addressProvider = new AddressTreeDataProvider(context);
  vscode.window.createTreeView('addressView', { treeDataProvider: addressProvider });
  context.subscriptions.push(
    vscode.commands.registerCommand('addressView.selectAddress', async (addressId: string) => {
      await context.globalState.update('selectedAddressId', addressId);
      addressProvider.refresh();
    })
  );

  // NOTE: Card View
  const cardProvider = new CardTreeDataProvider(context);
  vscode.window.createTreeView('cardView', { treeDataProvider: cardProvider });
  context.subscriptions.push(
    vscode.commands.registerCommand('cardView.selectCard', async (cardId: string) => {
      await context.globalState.update('selectedCardId', cardId);
      cardProvider.refresh();
    })
  );

  // NOTE: Order View
  const orderProvider = new OrderHistoryProvider(context);
  vscode.window.createTreeView('orderView', { treeDataProvider: orderProvider });
  vscode.commands.registerCommand('orderHistory.trackPackage', (orderItem) => {
    const trackingUrl = orderItem?.order.tracking.url;
    if (trackingUrl) {
      vscode.env.openExternal(vscode.Uri.parse(trackingUrl));
    }
  });

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
