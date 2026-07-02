import { NavLink, Outlet } from 'react-router-dom';
import { Gem, Home, PlusCircle, Search, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';

export function Layout(){
  const {language,setLanguage,t}=useI18n();
  return <div className="shell">
    <aside className="side">
      <div className="brand"><Sparkles size={24}/><div><strong>Jewelry</strong><span>WARDROBE</span></div></div>
      <div className="language-switch"><button className={language==='zh'?'on':''} onClick={()=>setLanguage('zh')}>中文</button><button className={language==='en'?'on':''} onClick={()=>setLanguage('en')}>English</button></div>
      <nav>
        <NavLink to="/"><Home size={18}/>{t('home')}</NavLink>
        <NavLink to="/items"><Gem size={18}/>{t('allJewelry')}</NavLink>
        <NavLink to="/new"><PlusCircle size={18}/>{t('addJewelry')}</NavLink>
      </nav>
      <div className="tip">{t('tipTitle')}<br/>{t('tipBody')}</div>
    </aside>
    <main className="main">
      <header className="top"><div className="search"><Search size={16}/>{t('searchPlaceholder')}</div></header>
      <Outlet />
    </main>
  </div>
}
