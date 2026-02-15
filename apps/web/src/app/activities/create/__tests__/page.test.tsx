import { redirect } from 'next/navigation'
import NewActivityPage from '../page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('NewActivityPage', () => {
  it('should redirect to /dashboard', () => {
    NewActivityPage()
    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })
})
