export type JewelryCategory = '项链' | '耳环' | '戒指' | '手链' | '手表' | '胸针' | '脚链' | '其他';
export type JewelryMaterial = '925银' | '18K金' | '14K金' | '铂金' | '珍珠' | '钻石' | '天然石' | '合金' | '玫瑰金' | '其他';
export type JewelryOccasion = '日常' | '通勤' | '正式' | '约会' | '派对' | '旅行';
export type JewelryStatus = '常戴' | '收藏' | '需保养' | '已遗失' | '想转卖';

export interface JewelryItem {
  id: string;
  photos: string[];
  name: string;
  brand?: string;
  category: JewelryCategory;
  materials: JewelryMaterial[];
  colors: string[];
  purchaseSource?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  referencePrice?: number;
  referenceUrl?: string;
  occasions: JewelryOccasion[];
  wearCount: number;
  lastWornDate?: string;
  status: JewelryStatus;
  storageLocation?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
