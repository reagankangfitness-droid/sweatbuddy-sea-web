import { redirect } from 'next/navigation'

export default function CitiesPage() {
  redirect('/singapore?tab=map')
}
