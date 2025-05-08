import * as vscode from 'vscode';
import { CoffeeTreeDataProvider } from './providers/coffee-tree-data-provider';
import { AddressTreeDataProvider } from './providers/address-tree-data-provider';
import { CardTreeDataProvider } from './providers/card-tree-data-provider';
import { OrderHistoryProvider } from './providers/order-history-tree-data-provider';
import { ClientBuilder } from './client-builder';

export let client = new ClientBuilder();

export async function initializeExtension(context: vscode.ExtensionContext) {
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
    }),
    vscode.commands.registerCommand('addressView.addAddress', () => {
      if (client.isInitialized()) {
        addressProvider.openWebview(context);
      }
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
      if (client.isInitialized()) {
        cardProvider.openWebview(context);
      }
    }),
    vscode.commands.registerCommand('cardView.refresh', () => {
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
    }),
    vscode.commands.registerCommand('orderHistory.refresh', () => {
      orderProvider.refresh();
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
        if (client.isInitialized()) {
          coffeeProvider.openWebview(context, () => {
            orderProvider.refresh()
          });
        }
      } else {
        coffeeProvider.removeProductFromCart(product.id);
        coffeeProvider.refreshWebview();
      }
    }),
    vscode.commands.registerCommand('productView.addToCart', (product: any) => {
      if (typeof product === 'string') {
        return;
      }
      coffeeProvider.addProductToCart(product.id, product.label, product.tooltip);
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
        if (client.isInitialized()) {
          coffeeProvider.openWebview(context, () => {
            orderProvider.refresh();
          });
        }
      } else {
        coffeeProvider.refreshWebview();
        coffeeProvider.reveal();
      }
    }),
    vscode.commands.registerCommand('productView.refresh', () => {
      coffeeProvider.refresh();
    }),
    vscode.commands.registerCommand('closeAllPanels', () => {
      coffeeProvider.closePane();
      addressProvider.closePane();
      cardProvider.closePane();
    }),
    vscode.commands.registerCommand('clearToken', async () => {
      await context.globalState.update('userApiToken', undefined);
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    }),
  );
}

function initializeClient(token: string) {
  const environment = token.split('_')[1];

  if (!environment) {
    vscode.window.showErrorMessage('Invalid token');
  }

  switch (environment) {
    case 'live':
      client.setEnvironment('production');
      client.setToken(token);
      break;
    case 'test':
      client.setEnvironment('dev');
      client.setToken(token);
      break;
    default:
      vscode.window.showErrorMessage('Invalid token');
  }
  vscode.commands.executeCommand('closeAllPanels');
  client.initialize();
  vscode.commands.executeCommand('addressView.refresh');
  vscode.commands.executeCommand('cardView.refresh');
  vscode.commands.executeCommand('orderHistory.refresh');
  vscode.commands.executeCommand('productView.refresh');
}

export async function activate(context: vscode.ExtensionContext) {
  const savedToken: string | undefined = await context.globalState.get('userApiToken');
  context.subscriptions.push(
    vscode.commands.registerCommand('registerToken', async () => {
      const token = await vscode.window.showInputBox({
        prompt: 'Paste your token',
        ignoreFocusOut: true,
        password: false
      });
      if (token) {
        initializeClient(token.trim());
        await context.globalState.update('userApiToken', token);
      } else {
        vscode.window.showWarningMessage('No token entered.');
      }
    }),
  );

  if (!savedToken) {
    await vscode.commands.executeCommand('registerToken');
  } else {
    initializeClient(savedToken);
  }

  await initializeExtension(context);
}

export function deactivate() { }
