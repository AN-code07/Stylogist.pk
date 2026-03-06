import React from 'react'
import HomeHeader from '../components/home/HomeHeader'
import FeaturedProducts from '../components/home/FeaturedProducts'
import TrendingProducts from '../components/home/TrendingProducts'
import NewArrivals from '../components/home/NewArrivals'
import DealsOfDay from '../components/home/DealsOfDay'
import CategoryHighlights from '../components/home/CategoryHighlights'
import AiSuggestedProducts from '../components/home/AiSuggestedProducts'
import CustomerReviews from './CustomerReviews'

export default function Home() {
  return (
    <>
      <HomeHeader />
      <div className='w-full sm:w-[90%] mx-auto '>
        <FeaturedProducts />
        <NewArrivals />
        {/* <DealsOfDay /> */}
        <TrendingProducts />
        {/* <CategoryHighlights /> */}
        <AiSuggestedProducts />
        <CustomerReviews />
      </div>
    </>

  )
}
