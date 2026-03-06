import React from 'react'
import DealHeader from '../components/HotDeals/DealHeader'
import TrendingProducts from '../components/home/TrendingProducts'
import NewsletterBanner from './NewsletterBanner'
import DealsOfDay from '../components/home/DealsOfDay'

export default function HotDeals() {
  return (
    <>
      <DealHeader />
      <div className='w-full sm:w-[90%] mx-auto'>
        <TrendingProducts />
        <DealsOfDay />
        <NewsletterBanner />

      </div>
    </>
  )
}
