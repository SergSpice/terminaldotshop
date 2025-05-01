import * as vscode from 'vscode';
import { client } from '../extension';
import { ProductItem } from '../models/product-item';
import path from 'path';
import fs from 'fs';
import { formatPrice } from '../utils/price-formatter';
import { openReactWebview } from '../open-webview';
import Terminal from '@terminaldotshop/sdk';

interface Cart {
  products: {
    id: string,
    title: string,
    description: string,
    quantity: number,
  }[],
  selectedAddress: {
    id: string,
    title: string,
  } | undefined,
  selectedCard: {
    id: string,
    number: string,
    expiration: string,
  } | undefined,
}

export class CoffeeTreeDataProvider implements vscode.TreeDataProvider<ProductItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProductItem | undefined | null | void> = new vscode.EventEmitter<ProductItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProductItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private productsCache: Terminal.Product[] | null = null;
  private panel: vscode.WebviewPanel | undefined;
  private cart: Cart = {
    products: [],
    selectedAddress: undefined,
    selectedCard: undefined,
  };

  constructor(private context: vscode.ExtensionContext) { }

  addProductToCart(productId: string, title: string, description: string) {
    const variantId = this.productsCache!.find(p => p.id === productId)!.variants[0].id;
    const productIndex = this.cart.products.findIndex(p => p.id === variantId);
    if (productIndex !== -1) {
      this.cart.products[productIndex].quantity += 1;
    } else {
      this.cart.products.push({
        id: variantId,
        quantity: 1,
        title,
        description,
      });
    }
  }

  removeProductFromCart(productId: string) {
    const variantId = this.productsCache!.find(p => p.id === productId)!.variants[0].id;
    const productIndex = this.cart.products.findIndex(p => p.id === variantId);
    if (productIndex !== -1) {
      this.cart.products[productIndex].quantity -= 1;
      if (this.cart.products[productIndex].quantity <= 0) {
        this.cart.products.splice(productIndex, 1);
      }
    }
  }

  setSelectedAddress(addressId: string, title: string) {
    this.cart.selectedAddress = {
      id: addressId,
      title: title,
    }
  }

  setSelectedCard(cardId: string, number: string, expiration: string) {
    this.cart.selectedCard = {
      id: cardId,
      number: number,
      expiration: expiration,
    }
  }

  refreshWebview() {
    if (this.panel) {
      this.panel.webview.postMessage({ command: 'updateCart', payload: this.cart });
    }
  }

  getTreeItem(element: ProductItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element: ProductItem): Promise<ProductItem[]> {
    if (this.productsCache === null) {
      this.productsCache = await this.fetchProducts();
    }

    if (!element) {
      return [
        new ProductItem('🌟 Featured 🌟', vscode.TreeItemCollapsibleState.Expanded, 'group'),
        new ProductItem('☕ Originals ☕', vscode.TreeItemCollapsibleState.Expanded, 'group')
      ];
    }

    if (element.type === 'group') {
      let filteredProducts: Terminal.Product[];
      if (element.label.includes('Featured')) {
        filteredProducts = this.productsCache!.filter(p => p.tags?.featured === true);
      } else {
        filteredProducts = this.productsCache!.filter(p => p.tags?.featured === false);
      }
      return filteredProducts.map(product => {
        const productIcon = this.generateIcon(product.id, product?.tags?.color)
        return new ProductItem(
          product.name,
          vscode.TreeItemCollapsibleState.None,
          'product',
          productIcon,
          `- ${formatPrice(product.variants[0].price)} | ${product.variants[0].name}`,
          product.description,
          {
            command: 'productView.addToCart',
            title: 'Add to Cart',
            arguments: [product.id]
          }
        )
      });
    }

    return [];
  }

  generateIcon(
    productId: string,
    color?: string
  ): vscode.Uri {
    const svgContent = ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
      <path fill="${color || 'white'}" d="M18 8H20C21.1 8 22 8.9 22 10V12C22 13.1 21.1 14 20 14H18V15C18 17.76 15.76 20 13 20H8C5.24 20 3 17.76 3 15V8H18V8ZM20 12V10H18V12H20ZM6 4H18V6H6V4Z"/>
    </svg>`;
    const tempPath = path.join(this.context.extensionPath, 'tmp', `${productId}.svg`);
    fs.writeFileSync(tempPath, svgContent);
    return vscode.Uri.file(tempPath);
  }

  async fetchProducts() {
    const response = await client!.product.list();
    this.context.globalState.update('products', response.data);
    return response.data;
  }

  openWebview(context: vscode.ExtensionContext, onOrderPlaced: () => void) {
    if (!this.panel) {
      this.panel = openReactWebview(
        'checkout',
        context,
        'Checkout',
        () => { },
        async (message: any, panel) => {
          switch (message.command) {
            case 'onMount':
              this.refreshWebview();
              break;
            case 'calculateTotal':
              await client!.cart.clear();
              const promises = [];
              message.payload.products.forEach(async (product: any) => {
                const request = client!.cart.setItem({
                  productVariantID: product.id,
                  quantity: product.quantity,
                })
                promises.push(request);
              });
              promises.push(client!.cart.setAddress({
                addressID: message.payload.address
              }));
              promises.push(client!.cart.setCard({
                cardID: message.payload.card
              }));
              try {
                await Promise.all(promises);
                const cart = await client!.cart.get();
                this.panel!.webview.postMessage({
                  command: 'calculateTotal',
                  payload: formatPrice(cart.data.amount.total!),
                });
              } catch (_) {
                this.panel!.webview.postMessage({ command: 'calculateTotal', payload: '' });
                vscode.window.showErrorMessage('Error calculating total');
              }
              break;
            case 'placeOrder':
              try {
                await client!.cart.convert();
                this.panel!.webview.postMessage({ command: 'orderPlaced' });
                onOrderPlaced();
                this.resetCart();
                vscode.window.showInformationMessage('Order placed successfully!');
              } catch (err) {
                this.panel!.webview.postMessage({ command: 'calculateTotal', payload: '' });
                vscode.window.showErrorMessage('Error placing order');
              }
              break;
            case 'close':
              panel.dispose();
              this.panel = undefined;
              break;
          }
        }
      );

      this.panel.onDidChangeViewState((e) => {
        if (e.webviewPanel.visible) {
          this.refreshWebview();
        }
      });

      this.panel.onDidDispose(() => {
        this.resetCart();
        this.panel = undefined
      });
    } else {
      this.panel.reveal(vscode.ViewColumn.One);
      this.refreshWebview();
    }
  }

  resetCart() {
    this.cart = {
      products: [],
      selectedAddress: undefined,
      selectedCard: undefined,
    }
  }

  isPanelOpen(): boolean {
    return !!this.panel;
  }

  reveal() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
    }
  }

  refresh(): void {
    this.productsCache = null;
  }
}
