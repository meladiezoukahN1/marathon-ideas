import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "ماراثون الأفكار - إدارة المستخدمين",
  description: "إدارة المستخدمين للماراثون",
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>{children}</div>
  )
}

export default Layout