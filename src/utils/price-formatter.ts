export function formatPrice(cents: number): string {
  const dollars = (cents / 100).toFixed(2); // Converts 3000 -> "30.00"
  return `$${dollars}`;
}

