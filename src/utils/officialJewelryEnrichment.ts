import { JewelryCategory, JewelryMaterial } from '../types/jewelry';

export interface OfficialJewelryEnrichmentRequest {
  image?: string;
  name?: string;
  brand?: string;
  series?: string;
  category?: JewelryCategory;
  materials?: JewelryMaterial[];
  mainStone?: string;
  metalColor?: string;
}

export interface OfficialJewelryEnrichmentResult {
  productName?: string;
  brand?: string;
  series?: string;
  productUrl?: string;
  imageUrl?: string;
  priceText?: string;
  priceAmount?: number;
  currency?: string;
  materialDescription?: string;
  materials?: JewelryMaterial[];
  sourceTitle?: string;
  matchConfidence?: 'high' | 'medium' | 'low';
  fetchedAt?: string;
}

export async function enrichJewelryFromOfficialSource(
  request: OfficialJewelryEnrichmentRequest
): Promise<OfficialJewelryEnrichmentResult> {
  const response = await fetch('/api/enrich-jewelry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || '官网资料搜索失败，请稍后再试');
  }

  return payload as OfficialJewelryEnrichmentResult;
}
