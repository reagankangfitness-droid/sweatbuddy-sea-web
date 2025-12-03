import { Header } from '@/components/header'
import { Hero } from '@/components/Hero'
import { RollingBanner } from '@/components/RollingBanner'
import { HowItWorks } from '@/components/HowItWorks'
import { Events } from '@/components/Events'
import { Cities } from '@/components/Cities'
import { Mission } from '@/components/Mission'
import { ForOrganizers } from '@/components/ForOrganizers'
import { SubmitForm } from '@/components/SubmitForm'
import { Newsletter } from '@/components/Newsletter'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <RollingBanner />
        <HowItWorks />
        <Events />
        <Cities />
        <Mission />
        <ForOrganizers />
        <SubmitForm />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
