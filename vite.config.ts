import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',manifest:{name:'Jewelry Wardrobe',short_name:'Jewelry',description:'个人首饰管理 App',theme_color:'#c89145',background_color:'#fbf8f3',display:'standalone',start_url:'/',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml'}]}})]});
