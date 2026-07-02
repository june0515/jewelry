import Dexie, { Table } from 'dexie';
import { JewelryItem } from '../types/jewelry';

class JewelryDatabase extends Dexie {
  jewelry!: Table<JewelryItem, string>;
  constructor(){
    super('JewelryWardrobeDB');
    this.version(1).stores({jewelry:'id, name, category, status, createdAt, lastWornDate'});
  }
}
export const db = new JewelryDatabase();
