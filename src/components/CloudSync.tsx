import { useEffect } from 'react';
import { syncJewelryWithCloud } from '../utils/cloudSync';

export function CloudSync() {
  useEffect(() => {
    syncJewelryWithCloud().catch(error => {
      console.warn('Cloud sync failed:', error);
    });
  }, []);

  return null;
}
