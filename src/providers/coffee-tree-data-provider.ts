import * as vscode from 'vscode';
import { client } from '../extension';
import { ProductItem } from '../models/product-item';
import path from 'path';
import fs from 'fs';
import Terminal from '@terminaldotshop/sdk';

export class CoffeeTreeDataProvider implements vscode.TreeDataProvider<ProductItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProductItem | undefined | null | void> = new vscode.EventEmitter<ProductItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProductItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private productsCache: Terminal.Product[] | null = null;

  constructor(private context: vscode.ExtensionContext) { }

  getTreeItem(element: ProductItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element: ProductItem): Promise<ProductItem[]> {
    if (this.productsCache === null) {
      this.productsCache = await this.fetchProducts();
    }

    if (!element) {
      return [
        new ProductItem('🌟 Featured', vscode.TreeItemCollapsibleState.Expanded, 'group'),
        new ProductItem('☕ Originals', vscode.TreeItemCollapsibleState.Expanded, 'group')
      ];
    }

    if (element.type === 'group') {
      let filteredProducts: Terminal.Product[];
      if (element.label.includes('Featured')) {
        filteredProducts = this.productsCache.filter(p => p.tags?.featured === true);
      } else {
        filteredProducts = this.productsCache.filter(p => p.tags?.featured === false);
      }
      return filteredProducts.map(product => {
        const productIcon = this.generateIcon(product.id, product?.tags?.color)
        return new ProductItem(
          product.name,
          vscode.TreeItemCollapsibleState.None,
          'product',
          productIcon,
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
    console.log('Fetching products');
    const response = await client.product.list();
    return response.data;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
