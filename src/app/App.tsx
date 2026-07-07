import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DashboardPage } from '../pages/DashboardPage';
import { ListPage } from '../pages/ListPage';
import { FormPage } from '../pages/FormPage';
import { DetailPage } from '../pages/DetailPage';
import { WatchesPage } from '../pages/WatchesPage';
import { WearHistoryPage } from '../pages/WearHistoryPage';
import { WishlistPage } from '../pages/WishlistPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { I18nProvider } from '../i18n';
import { CloudSync } from '../components/CloudSync';
const router = createBrowserRouter([{path:'/', element:<Layout/>, children:[{index:true,element:<DashboardPage/>},{path:'items',element:<ListPage/>},{path:'watches',element:<WatchesPage/>},{path:'new',element:<FormPage/>},{path:'wear-history',element:<WearHistoryPage/>},{path:'wishlist',element:<WishlistPage/>},{path:'analytics',element:<AnalyticsPage/>},{path:'settings',element:<SettingsPage/>},{path:'items/:id',element:<DetailPage/>},{path:'items/:id/edit',element:<FormPage/>}]}]);
export default function App(){ return <I18nProvider><CloudSync/><RouterProvider router={router}/></I18nProvider>; }
