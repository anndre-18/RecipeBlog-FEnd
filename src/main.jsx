import {BrowserRouter} from 'react-router'
import { Routes } from 'react-router'
import { Route } from 'react-router'
import { createRoot } from 'react-dom/client'
import './index.css'

import MainLayout from './MainLayout.jsx'
import Register from './Components/Register.jsx'
import AddRecipe from './Components/AddRecipe.jsx'
import Home from './Components/Home.jsx'
// import Login from './Components/login.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* <Route path='/login' element={<Login/>}/>
      <Route path='/register' element={<Register/>}/> */}
      <Route element={<MainLayout/>}>
        <Route path='/' element={<Home/>}/>
        <Route path='/addrecipe' element={<AddRecipe/>}/>
        <Route path='/register' element={<Register/>}/>
      </Route>
    </Routes>
  
  </BrowserRouter>


  
    
  
)
