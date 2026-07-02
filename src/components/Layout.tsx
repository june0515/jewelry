import { NavLink, Outlet } from 'react-router-dom';
import { Gem, Home, PlusCircle, Search, Sparkles } from 'lucide-react';

export function Layout(){
  return <div className="shell">
    <aside className="side">
      <div className="brand"><Sparkles size={24}/><div><strong>Jewelry</strong><span>WARDROBE</span></div></div>
      <nav>
        <NavLink to="/"><Home size={18}/>首页</NavLink>
        <NavLink to="/items"><Gem size={18}/>所有首饰</NavLink>
        <NavLink to="/new"><PlusCircle size={18}/>添加首饰</NavLink>
      </nav>
      <div className="tip">今日小提示 ✨<br/>把常戴首饰放在浅盘里，更容易坚持记录。</div>
    </aside>
    <main className="main">
      <header className="top"><div className="search"><Search size={16}/>搜索首饰名称 / 品牌 / 材质...</div></header>
      <Outlet />
    </main>
  </div>
}
