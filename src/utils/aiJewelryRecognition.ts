import {
  JewelryCategory,
  JewelryMaterial,
  JewelryOccasion,
  JewelryStatus,
} from '../types/jewelry';

export interface JewelryRecognitionResult {
  name?: string;
  brand?: string;
  series?: string;
  category?: JewelryCategory;
  materials?: JewelryMaterial[];
  mainStone?: string;
  metalColor?: string;
  colors?: string[];
  occasions?: JewelryOccasion[];
  status?: JewelryStatus;
  note?: string;
}

export async function recognizeJewelry(photo: string): Promise<JewelryRecognitionResult> {
  const response = await fetch('/api/identify-jewelry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: photo }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'AI 识别失败，请稍后再试');
  }

  return payload as JewelryRecognitionResult;
}
