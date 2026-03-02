import React from 'react'
import AboutHeader from '../components/about/AboutHeader'
import AboutStory from '../components/about/AboutStory'
import VisionStory from '../components/about/VisionStory'
import CoreValues from '../components/about/CoreValues'
import OurTeam from '../components/about/OurTeam'

export default function About() {
  return (
    <div>
        <AboutHeader/>
        <AboutStory/>
        <VisionStory/>
        <CoreValues/>
        <OurTeam/>
    </div>
  )
}
