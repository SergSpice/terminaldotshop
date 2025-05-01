import * as vscode from 'vscode';
import { client } from '../extension';
import Terminal from '@terminaldotshop/sdk';

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
}

interface Order {
  orderNumber: string;
  totalPaid: string;
  items: OrderItem[];
}

export class OrderHistoryProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private ordersCache: Terminal.Order[] | null = null;

  constructor(private context: vscode.ExtensionContext) { }

  refresh() {
    this.ordersCache = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!this.ordersCache) {
      this.ordersCache = await this.fetchOrderHistory();
    }

    if (!element) {
      return this.ordersCache.map((order, index) => {
        const orderTotal = ((order.amount.subtotal + order.amount.shipping) / 100).toFixed(2);
        const label = `📦 Order #${this.ordersCache!.length - index - 1} - $${orderTotal}`;
        const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.tooltip = `Order ${this.ordersCache!.length - index - 1} | Total: $${orderTotal}`;
        treeItem.contextValue = 'order';
        treeItem.id = order.id;
        (treeItem as any).order = order; // Attach raw order data
        return treeItem;
      });
    } else {
      const order = (element as any).order as Order;
      return order.items.map((item: any) => {
        const response = this.findVariantById(item.productVariantID);
        const itemLabel = `${response?.product.name} (${response?.variant?.name})`;
        const itemTree = new vscode.TreeItem(itemLabel, vscode.TreeItemCollapsibleState.None);
        itemTree.description = `x${item.quantity}`;
        itemTree.iconPath = new vscode.ThemeIcon('coffee');
        return itemTree;
      });
    }
  }

  findVariantById(variantId: string) {
    const products: Terminal.Product[] = this.context.globalState.get('products') as Terminal.Product[];
    for (const item of products) {
      const variant = item.variants.find(v => v.id === variantId);
      if (variant) {
        return { product: item, variant };
      }
    }
    return null;
  }

  async fetchOrderHistory(): Promise<Terminal.Order[]> {
    const response = await client.order.list();
    return response.data;
  }
}
