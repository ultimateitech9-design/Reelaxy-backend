/**
 * Gifts that can be sent in chat and during calls. Prices (coins) live here on the
 * server so the client cannot choose its own price. Keep in sync with the frontend
 * list in Reelaxy-frontend/src/features/gifts/catalog.ts.
 */
export const GIFT_CATALOG: { label: string; emoji: string; price: number }[] = [
  { label: 'Kiss', emoji: '💋', price: 49 },
  { label: 'Red Rose', emoji: '🌹', price: 29 },
  { label: 'Burgundy Rose', emoji: '🌹', price: 39 },
  { label: 'White Rose', emoji: '🌹', price: 39 },
  { label: 'Pink Rose', emoji: '🌹', price: 29 },
  { label: 'Yellow Rose', emoji: '🌹', price: 29 },
  { label: 'Red-tipped Rose', emoji: '🌹', price: 49 },
  { label: 'Orange Rose', emoji: '🌹', price: 39 },
  { label: 'Peach Rose', emoji: '🌹', price: 29 },
  { label: 'Lavender Rose', emoji: '🌹', price: 59 },
  { label: 'Blue Rose', emoji: '🌹', price: 79 },
  { label: 'Black Rose', emoji: '🌹', price: 99 },
  { label: 'Toffee Candy', emoji: '🍬', price: 19 },
  { label: 'Chocolate Box', emoji: '🍫', price: 49 },
  { label: 'Teddy Bear', emoji: '🧸', price: 79 },
  { label: 'Flower Bouquet', emoji: '💐', price: 119 },
  { label: 'Champagne Bottle', emoji: '🥂', price: 149 },
  { label: 'Diamond Ring', emoji: '💍', price: 249 },
  { label: 'Heart Balloon', emoji: '🎈', price: 29 },
  { label: 'True Love Heart', emoji: '❤️', price: 29 },
  { label: 'Broken Heart', emoji: '💔', price: 19 },
  { label: 'Sparkling Heart', emoji: '💖', price: 39 },
  { label: 'Gold Heart', emoji: '💛', price: 99 },
];

export function findGift(label?: string | null) {
  const key = String(label || '').trim().toLowerCase();
  return key ? GIFT_CATALOG.find((gift) => gift.label.toLowerCase() === key) : undefined;
}
