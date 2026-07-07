import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, CalendarDays, Gem, Heart, Home, Palette, PlusCircle, Search, Settings, Sparkles, Watch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

const themes = [
  { id: 'gold', label: 'themeGold' },
  { id: 'silver', label: 'themeSilver' },
  { id: 'rose', label: 'themeRose' },
] as const;

export function Layout(){
  const {language,setLanguage,t}=useI18n();
  const [theme,setTheme]=useState(() => {
    const saved = localStorage.getItem('jewelry-theme');
    return themes.some(option => option.id === saved) ? saved! : 'gold';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('jewelry-theme', theme);
  }, [theme]);
  return <div className="shell">
    <aside className="side">
      <div className="brand"><Sparkles size={24}/><div><strong>Jewelry</strong><span>WARDROBE</span></div></div>
      <div className="language-switch"><button className={language==='zh'?'on':''} onClick={()=>setLanguage('zh')}>中文</button><button className={language==='en'?'on':''} onClick={()=>setLanguage('en')}>English</button></div>
      <nav>
        <NavLink to="/"><Home size={18}/>{t('home')}</NavLink>
        <NavLink to="/items"><Gem size={18}/>{t('allJewelry')}</NavLink>
        <NavLink to="/new"><PlusCircle size={18}/>{t('addJewelry')}</NavLink>
        <NavLink to="/wear-history"><CalendarDays size={18}/>{t('wearHistory')}</NavLink>
        <NavLink to="/wishlist"><Heart size={18}/>{t('wishlist')}</NavLink>
        <NavLink to="/analytics"><BarChart3 size={18}/>{t('analytics')}</NavLink>
        <NavLink to="/watches"><Watch size={18}/>{t('watches')}</NavLink>
        <NavLink to="/settings"><Settings size={18}/>{t('settings')}</NavLink>
      </nav>
      <div className="theme-panel">
        <div><Palette size={16}/>{t('themeColor')}</div>
        <div className="theme-options">{themes.map(option=><button key={option.id} className={theme===option.id?'on':''} data-theme-option={option.id} onClick={()=>setTheme(option.id)} aria-label={t(option.label)} title={t(option.label)}/>)}</div>
      </div>
      <div className="tip">{t('tipTitle')}<br/>{t('tipBody')}</div>
    </aside>
    <main className="main">
      <header className="top"><div className="search"><Search size={16}/>{t('searchPlaceholder')}</div></header>
      <Outlet />
    </main>
    <nav className="bottom-nav">
      <NavLink to="/"><Home size={18}/><span>{t('home')}</span></NavLink>
      <NavLink to="/items"><Gem size={18}/><span>{t('collection')}</span></NavLink>
      <NavLink to="/new"><PlusCircle size={20}/><span>{t('add')}</span></NavLink>
      <NavLink to="/wear-history"><CalendarDays size={18}/><span>{t('records')}</span></NavLink>
      <NavLink to="/settings"><Settings size={18}/><span>{t('mine')}</span></NavLink>
    </nav>
  </div>
}
