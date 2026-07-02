import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DashboardPage } from '../pages/DashboardPage';
import { ListPage } from '../pages/ListPage';
import { FormPage } from '../pages/FormPage';
import { DetailPage } from '../pages/DetailPage';
const router = createBrowserRouter([{path:'/', element:<Layout/>, children:[{index:true,element:<DashboardPage/>},{path:'items',element:<ListPage/>},{path:'new',element:<FormPage/>},{path:'items/:id',element:<DetailPage/>},{path:'items/:id/edit',element:<FormPage/>}]}]);
export default function App(){ return <RouterProvider router={router}/>; }
