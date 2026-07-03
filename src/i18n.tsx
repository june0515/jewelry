import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type Language = 'zh' | 'en';

const dictionary = {
  zh: {
    home: '首页',
    allJewelry: '所有首饰',
    addJewelry: '添加首饰',
    searchPlaceholder: '搜索首饰名称 / 品牌 / 材质...',
    tipTitle: '今日小提示',
    tipBody: '把常戴首饰放在浅盘里，更容易坚持记录。',
    goodMorning: '早安，June!',
    wardrobeSubtitle: '你的首饰衣橱 · 记录每一次闪耀',
    addItem: '+ 添加首饰',
    add: '+ 添加',
    total: '总数',
    pieces: '件首饰',
    favorites: '常戴',
    totalValue: '总价值',
    estimate: '估算',
    maintenance: '需保养',
    unwornNotice: '有 {count} 件首饰超过 45 天未佩戴，可以翻出来搭配一下。',
    recentlyAdded: '最近添加',
    exportJson: '导出 JSON',
    emptyDashboard: '还没有首饰，先添加你的第一件项链 / 戒指吧。',
    searchInput: '搜索名称/品牌/材质',
    allCategories: '全部分类',
    allStatuses: '全部状态',
    wearCount: '佩戴 {count} 次',
    notRecorded: '未记录',
    editJewelry: '编辑首饰',
    aiTitle: 'AI 识别首饰',
    aiBody: '上传照片后，可自动建议名称、分类、材质、颜色和备注。',
    recognizing: '识别中...',
    aiIdentify: 'AI 识别',
    name: '名称',
    namePlaceholder: '如 Van Cleef 四叶草项链',
    brand: '品牌',
    category: '分类',
    status: '状态',
    materials: '材质',
    occasions: '佩戴场合',
    colors: '颜色',
    colorsPlaceholder: '金色, 银色, 珍珠白',
    purchaseDate: '购入日期',
    price: '价格',
    referencePrice: '参考价格',
    referenceUrl: '来源链接',
    reference: '参考',
    viewSource: '查看来源',
    purchaseSource: '购入渠道',
    storageLocation: '收纳位置',
    note: '备注',
    save: '保存',
    uploadPhotos: '+ 上传照片',
    missingName: '请填写名称',
    missingItem: '找不到这件首饰',
    galleryPlaceholder: '首饰',
    wornToday: '今天戴了它',
    edit: '编辑',
    delete: '删除',
    deleteConfirm: '确定删除吗？',
    wornTimes: '佩戴次数',
    lastWorn: '最近佩戴',
    purchase: '购入',
    source: '渠道',
    none: '-',
    aiFailed: 'AI 识别失败，请稍后再试',
  },
  en: {
    home: 'Home',
    allJewelry: 'All Jewelry',
    addJewelry: 'Add Jewelry',
    searchPlaceholder: 'Search name / brand / material...',
    tipTitle: 'Today’s tip',
    tipBody: 'Keep everyday pieces in a shallow tray so they are easier to log.',
    goodMorning: 'Good morning, June!',
    wardrobeSubtitle: 'Your jewelry wardrobe · Capture every sparkle',
    addItem: '+ Add Jewelry',
    add: '+ Add',
    total: 'Total',
    pieces: 'pieces',
    favorites: 'Favorites',
    totalValue: 'Total Value',
    estimate: 'estimate',
    maintenance: 'Care Needed',
    unwornNotice: '{count} pieces have not been worn for over 45 days. Time to style them again.',
    recentlyAdded: 'Recently Added',
    exportJson: 'Export JSON',
    emptyDashboard: 'No jewelry yet. Add your first necklace or ring.',
    searchInput: 'Search name/brand/material',
    allCategories: 'All categories',
    allStatuses: 'All statuses',
    wearCount: 'Worn {count} times',
    notRecorded: 'Not recorded',
    editJewelry: 'Edit Jewelry',
    aiTitle: 'AI Jewelry Recognition',
    aiBody: 'Upload a photo to suggest name, category, material, color, and notes.',
    recognizing: 'Recognizing...',
    aiIdentify: 'AI Identify',
    name: 'Name',
    namePlaceholder: 'e.g. Van Cleef clover necklace',
    brand: 'Brand',
    category: 'Category',
    status: 'Status',
    materials: 'Materials',
    occasions: 'Occasions',
    colors: 'Colors',
    colorsPlaceholder: 'Gold, silver, pearl white',
    purchaseDate: 'Purchase Date',
    price: 'Price',
    referencePrice: 'Reference Price',
    referenceUrl: 'Source Link',
    reference: 'Reference',
    viewSource: 'View Source',
    purchaseSource: 'Purchase Source',
    storageLocation: 'Storage Location',
    note: 'Notes',
    save: 'Save',
    uploadPhotos: '+ Upload Photos',
    missingName: 'Please enter a name',
    missingItem: 'This jewelry item was not found',
    galleryPlaceholder: 'Jewelry',
    wornToday: 'Worn Today',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Delete this item?',
    wornTimes: 'Wear Count',
    lastWorn: 'Last Worn',
    purchase: 'Purchase',
    source: 'Source',
    none: '-',
    aiFailed: 'AI recognition failed. Please try again.',
  },
} as const;

const valueLabels: Record<Language, Record<string, string>> = {
  zh: {},
  en: {
    '项链': 'Necklace',
    '耳环': 'Earrings',
    '戒指': 'Ring',
    '手链': 'Bracelet',
    '手表': 'Watch',
    '胸针': 'Brooch',
    '脚链': 'Anklet',
    '其他': 'Other',
    '925银': '925 Silver',
    '18K金': '18K Gold',
    '14K金': '14K Gold',
    '铂金': 'Platinum',
    '珍珠': 'Pearl',
    '钻石': 'Diamond',
    '天然石': 'Natural Stone',
    '合金': 'Alloy',
    '玫瑰金': 'Rose Gold',
    '日常': 'Everyday',
    '通勤': 'Work',
    '正式': 'Formal',
    '约会': 'Date',
    '派对': 'Party',
    '旅行': 'Travel',
    '常戴': 'Favorite',
    '收藏': 'Collection',
    '需保养': 'Needs Care',
    '已遗失': 'Lost',
    '想转卖': 'Resell',
  },
};

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof dictionary.zh, params?: Record<string, string | number>) => string;
  label: (value: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return localStorage.getItem('jewelry-language') === 'en' ? 'en' : 'zh';
  });

  useEffect(() => {
    localStorage.setItem('jewelry-language', language);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key, params) => {
      let text: string = dictionary[language][key] || dictionary.zh[key];
      Object.entries(params || {}).forEach(([param, replacement]) => {
        text = text.replace(`{${param}}`, String(replacement));
      });
      return text;
    },
    label: value => valueLabels[language][value] || value,
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
