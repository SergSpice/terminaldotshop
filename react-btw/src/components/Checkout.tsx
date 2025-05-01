import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import vscode from "@/lib/vscode-bridge";
import { Loader2 } from "lucide-react";

interface Product {
  id: string,
  title: string,
  description: string,
  quantity: number,
}

interface Address {
  id: string,
  title: string,
}

interface Card {
  id: string,
  number: string,
  expiration: string,
}

export function Checkout() {
  const [products, setProducts] = useState<Product[]>([]);
  const [address, setAddress] = useState<Address | undefined>(undefined);
  const [card, setCard] = useState<Card | undefined>(undefined);
  const [total, setTotal] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.command === 'updateCart') {
        setProducts(msg.payload.products);
        setAddress(msg.payload.selectedAddress);
        setCard(msg.payload.selectedCard);
        setTotal('');
      }
      if (msg.command === 'calculateTotal') {
        setLoading(false);
        setTotal(msg.payload);
      }

      if (msg.command === 'orderPlaced') {
        setLoading(false);
        setPlaced(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div>
      {placed && (
        <div className="space-y-4 text-center">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-green-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-xl font-bold text-green-500">
            Order Placed Successfully!
          </h2>
          <p className="">
            Thank you for your order. Your order will be shipped to the address you provided.
          </p>
          <Button
            variant={'destructive'}
            onClick={() => {
              vscode.postMessage({
                command: 'close',
              });
            }}
          >
            Close Tab
          </Button>
        </div>
      )}
      {!placed && (
        <>
          <h1 className="text-2xl font-bold text-center py-4">
            Checkout
          </h1>
          <h2 className="text-xl font-bold">List of Items</h2>
          <div className="py-8 space-y-4">
            {products.length === 0 && (
              <div className="text-center text-gray-500">
                Your cart is empty. Please add some items to your cart.
              </div>
            )}
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-white dark:border-gray-200 py-4 rounded-lg shadow-lg flex justify-between items-center p-4"
              >
                <div>
                  <h2 className="font-bold text-lg underline">{product.title}</h2>
                  <p>{product.description}</p>
                </div>
                <div className="text-lg font-bold text-center w-14 p-4">
                  {product.quantity}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Shipping Address</h2>
            {address && (
              <div className="p-2 border border-dashed border-white dark:border-gray-200 rounded-lg shadow-lg">
                <h2>Shipping Address</h2>
                <p>{address.title}</p>
              </div>
            )}
            <h2 className="text-xl font-bold">Payment Method</h2>
            {card && (
              <div className="p-2 border border-dashed border-white dark:border-gray-200 rounded-lg shadow-lg">
                <p>{card.number}</p>
                <p className="italic">{card.expiration}</p>
              </div>
            )}
          </div>
          <div className="py-4">
            {!total && (
              <Button disabled={loading} onClick={() => {
                vscode.postMessage({
                  command: 'calculateTotal',
                  payload: {
                    products: products.map(product => ({
                      id: product.id,
                      quantity: product.quantity,
                    })),
                    address: address?.id,
                    card: card?.id,
                  },
                });
                setLoading(true);
              }}>
                {loading && <Loader2 className="animate-spin" />}
                Calculate Total
              </Button>
            )}
            {total && (
              <Button
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  vscode.postMessage({
                    command: 'placeOrder',
                  });
                }}
              >
                {loading && <Loader2 className="animate-spin" />}
                Place Order for ${total}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
