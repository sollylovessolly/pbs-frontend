import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/component/layout/Header'
import Footer from '@/component/layout/Footer'

const MainLayout = () => {
  return (
    <>
    <Header/>
    <Outlet/>
    <Footer/>

    </>
  )
}

export default MainLayout