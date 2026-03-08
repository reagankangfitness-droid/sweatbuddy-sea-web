'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle, Clock, HelpCircle, CreditCard, Calendar, Users, Shield, Send, Loader2, CheckCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
  category: 'booking' | 'payment' | 'refunds' | 'hosting' | 'account'
}

const faqs: FAQItem[] = [
  // Booking
  {
    category: 'booking',
    question: 'How do I book an experience?',
    answer: 'Browse experiences on the homepage or Discover page. Click on any experience to see details, then tap "Going" for free experiences or complete checkout for paid experiences. You\'ll receive a confirmation email with all the details.'
  },
  {
    category: 'booking',
    question: 'Can I book for multiple people?',
    answer: 'Currently, each person needs to book individually with their own email address. This ensures everyone receives their own confirmation and event reminders.'
  },
  {
    category: 'booking',
    question: 'What happens if an experience is full?',
    answer: 'You can join the waitlist! When a spot opens up, you\'ll be notified via email and have 24 hours to claim your spot before it goes to the next person.'
  },
  {
    category: 'booking',
    question: 'How do I cancel my booking?',
    answer: 'Go to "My Events" from your profile, find the booking you want to cancel, and click "Cancel Booking". The refund amount depends on how far in advance you cancel - check the event\'s refund policy for details.'
  },
  // Payment
  {
    category: 'payment',
    question: 'What payment methods are accepted?',
    answer: 'We accept credit/debit cards via Stripe (Visa, Mastercard, AMEX) and PayNow for Singapore users. Payment method availability depends on what the host has enabled.'
  },
  {
    category: 'payment',
    question: 'Is my payment information secure?',
    answer: 'Yes! We use Stripe for card payments, which is PCI-DSS compliant. We never store your full card details on our servers. PayNow payments go directly through your bank.'
  },
  {
    category: 'payment',
    question: 'What are the service fees?',
    answer: 'For paid experiences, there\'s a service fee of 3.7% + SGD $1.79 per ticket. This covers payment processing and platform costs. The fee is clearly shown before you complete your booking.'
  },
  {
    category: 'payment',
    question: 'How does PayNow payment work?',
    answer: 'After selecting PayNow, you\'ll see a QR code or phone number. Complete the payment through your banking app, then the host will verify your payment. You\'ll receive confirmation once verified.'
  },
  // Refunds
  {
    category: 'refunds',
    question: 'What is the refund policy?',
    answer: 'Refund policies vary by event. The standard policy is: Full refund if cancelled 24+ hours before, 50% refund if cancelled 2-24 hours before, and no refund within 2 hours of the event. Check each event\'s specific policy before booking.'
  },
  {
    category: 'refunds',
    question: 'How long do refunds take?',
    answer: 'Card refunds typically appear within 5-10 business days, depending on your bank. PayNow refunds are processed manually by the host and timing may vary.'
  },
  {
    category: 'refunds',
    question: 'What if the host cancels the experience?',
    answer: 'If a host cancels an experience, all attendees are automatically notified via email. You\'ll receive a full refund for paid experiences, processed within 5-10 business days.'
  },
  {
    category: 'refunds',
    question: 'Can I get a refund if I don\'t show up?',
    answer: 'No-shows are generally not eligible for refunds. If you can\'t attend, please cancel your booking in advance according to the refund policy to potentially receive a partial or full refund.'
  },
  // Hosting
  {
    category: 'hosting',
    question: 'How do I become a host?',
    answer: 'Sign in to SweatBuddies, go to your Profile, and click "Host Dashboard". You can submit your first experience for review. Once approved, your experience will be live on the platform.'
  },
  {
    category: 'hosting',
    question: 'How do I get paid as a host?',
    answer: 'For Stripe payments, earnings are transferred to your connected Stripe account (usually within 2-7 business days). For PayNow, you receive payments directly to your PayNow account.'
  },
  {
    category: 'hosting',
    question: 'What fees do hosts pay?',
    answer: 'Hosts can choose to pass fees to attendees or absorb them. The platform fee is 3.7% + SGD $1.79 per ticket. There are no monthly fees or subscriptions.'
  },
  // Account
  {
    category: 'account',
    question: 'How do I update my profile?',
    answer: 'Go to Profile > Settings to update your name, email, and notification preferences. Profile changes take effect immediately.'
  },
  {
    category: 'account',
    question: 'How do I delete my account?',
    answer: 'Contact us at support@sweatbuddies.co to request account deletion. Please note that any active bookings should be cancelled first, and this action cannot be undone.'
  },
]

const categories = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'booking', label: 'Booking', icon: Calendar },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'refunds', label: 'Refunds', icon: Shield },
  { id: 'hosting', label: 'Hosting', icon: Users },
]

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'general',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showAllFaqs, setShowAllFaqs] = useState(false)

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory)

  const displayedFaqs = showAllFaqs ? filteredFaqs : filteredFaqs.slice(0, 5)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })

      if (!res.ok) throw new Error('Failed to send message')

      setSubmitSuccess(true)
      setContactForm({ name: '', email: '', category: 'general', message: '' })
    } catch {
      setSubmitError('Failed to send message. Please try emailing us directly at support@sweatbuddies.co')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="max-w-4xl mx-auto flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-950 border border-neutral-800"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-300" />
            </Link>
            <h1 className="text-lg font-semibold text-neutral-100">Help & Support</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 mb-1">
            How can we help?
          </h2>
          <p className="text-sm text-neutral-500">
            Find answers below or reach out to our team.
          </p>
        </div>

        {/* FAQ Section */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-neutral-100 mb-4">
            Frequently Asked Questions
          </h3>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-white text-neutral-900'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {displayedFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-neutral-100 pr-4">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show All / Show Less */}
          {filteredFaqs.length > 5 && (
            <button
              onClick={() => { setShowAllFaqs(!showAllFaqs); setExpandedFaq(null) }}
              className="mt-4 w-full py-2.5 text-sm font-medium text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors"
            >
              {showAllFaqs ? 'Show fewer FAQs' : `Show all ${filteredFaqs.length} FAQs`}
            </button>
          )}
        </section>

        {/* Contact Form Section */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-neutral-100 mb-4">
            Still need help? Contact us
          </h3>

          {submitSuccess ? (
            <div className="bg-green-950 border border-green-800 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="font-semibold text-green-400 mb-1">Message Sent!</h4>
              <p className="text-green-400 text-sm">
                We&apos;ll get back to you within 24 hours. Check your email for our response.
              </p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="mt-4 text-green-400 text-sm font-medium hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-neutral-950 rounded-xl border border-neutral-800 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  What do you need help with?
                </label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="general">General Question</option>
                  <option value="booking">Booking Issue</option>
                  <option value="payment">Payment Problem</option>
                  <option value="refund">Refund Request</option>
                  <option value="hosting">Hosting Question</option>
                  <option value="bug">Report a Bug</option>
                  <option value="feedback">Feedback / Suggestion</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                  placeholder="Please describe your issue or question in detail. Include any relevant booking IDs or experience names."
                />
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-neutral-900 font-semibold rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Quick Links */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-neutral-100 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/my-bookings"
              className="flex items-center gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-neutral-100">My Bookings</p>
                <p className="text-sm text-neutral-500">View and manage your bookings</p>
              </div>
            </Link>
            <Link
              href="/host/dashboard"
              className="flex items-center gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-neutral-100">Host Dashboard</p>
                <p className="text-sm text-neutral-500">Manage your experiences</p>
              </div>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-neutral-100">Account Settings</p>
                <p className="text-sm text-neutral-500">Update your profile</p>
              </div>
            </Link>
            <a
              href="mailto:support@sweatbuddies.co"
              className="flex items-center gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              <Mail className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-neutral-100">Email Us Directly</p>
                <p className="text-sm text-neutral-500">support@sweatbuddies.co</p>
              </div>
            </a>
          </div>
        </section>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-3 text-center">
            <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-neutral-100">Response</p>
            <p className="text-[10px] text-neutral-500">Within 24 hours</p>
          </div>
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-3 text-center">
            <Mail className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-neutral-100">Email</p>
            <p className="text-[10px] text-neutral-500">support@sweatbuddies.co</p>
          </div>
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-3 text-center">
            <MessageCircle className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-medium text-neutral-100">Instagram</p>
            <p className="text-[10px] text-neutral-500">@sweatbuddies.co</p>
          </div>
        </div>
      </main>

      {/* Footer spacing */}
      <div className="h-20" />
    </div>
  )
}
