/**
 * Host Statistics Module
 *
 * Exports all statistics-related functions for use throughout the application.
 */

// Aggregation functions (for scheduled jobs)
export {
  aggregateHostStats,
  aggregateSingleHostStats,
  aggregateActivityStats,
  updateAttendeeHistory,
  createDailySnapshot,
  createMonthlySnapshot,
} from './aggregation'

// Real-time update functions (for immediate stats updates)
export {
  onBookingConfirmed,
  onBookingPaid,
  onBookingCancelled,
  onActivityCreated,
  onActivityCancelled,
  onActivityCompleted,
  trackActivityView,
  recalculateActivityFillRate,
  recalculateHostRates,
} from './realtime'
