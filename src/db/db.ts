import Dexie, { Table } from 'dexie';
import { JewelryItem, WearEvent, WishlistItem } from '../types/jewelry';

class JewelryDatabase extends Dexie {
  jewelry!: Table<JewelryItem, string>;
  wearEvents!: Table<WearEvent, string>;
  wishlist!: Table<WishlistItem, string>;
  constructor(){
    super('JewelryWardrobeDB');
    this.version(1).stores({jewelry:'id, name, category, status, createdAt, lastWornDate'});
    this.version(2).stores({
      jewelry:'id, name, brand, category, status, createdAt, lastWornDate, purchaseDate',
      wearEvents:'id, jewelryId, wornDate, createdAt',
      wishlist:'id, name, brand, category, createdAt'
    });
  }
}
export const db = new JewelryDatabase();
