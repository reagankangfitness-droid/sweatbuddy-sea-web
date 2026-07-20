function buildPlaceIntelligence(place) {
  const trustScore = calculatePlaceTrustScore(place)
  const photoQualityScore = calculatePhotoQualityScore(place)
  const reviewSentimentScore = calculateReviewSentimentScore(place)
  const activityLabel = humanizeTag(place.activities?.[0] || place.placeType || 'fitness')
  const area = place.area || 'Singapore'
  const rating = toNumber(place.googleRating)
  const reviewCount = place.googleReviewCount || place.reviewCount || 0

  const ratingClause =
    rating > 0 && reviewCount > 0
      ? ` It has a ${rating.toFixed(1)} public rating from ${reviewCount} review${reviewCount === 1 ? '' : 's'}.`
      : ''

  return {
    trustScore,
    photoQualityScore,
    reviewSentimentScore,
    aiSummary: `${place.name} is a ${activityLabel.toLowerCase()} listing around ${area}. SweatBuddies checks public source data, venue photos, rating signals, and community fit before surfacing it in the guide.${ratingClause}`,
    aiPros: buildPros(place, trustScore, photoQualityScore, reviewSentimentScore),
    aiCons: buildCons(place, trustScore, photoQualityScore, reviewCount),
  }
}

function calculatePlaceTrustScore(place) {
  let score = 20
  const rating = toNumber(place.googleRating)
  const googleReviewCount = place.googleReviewCount || 0
  const reviewCount = place.reviewCount || 0

  if (place.googlePlaceId) score += 10
  if (place.websiteUrl) score += 12
  if (place.sourceProvider) score += 8
  if (place.address && place.address.length > 6) score += 8
  if (place.googlePlaceId && place.websiteUrl) score += 5
  if (rating >= 4.6) score += 15
  else if (rating >= 4.2) score += 10
  else if (rating >= 3.8) score += 5
  if (googleReviewCount >= 250) score += 15
  else if (googleReviewCount >= 75) score += 11
  else if (googleReviewCount >= 20) score += 7
  else if (googleReviewCount > 0) score += 4
  if (reviewCount >= 10) score += 8
  else if (reviewCount > 0) score += 4
  if ((place.photos?.length || 0) + (place.mediaAssetCount || 0) >= 3) score += 10
  else if ((place.photos?.length || 0) + (place.mediaAssetCount || 0) > 0) score += 5
  if (place.socialScore && place.socialScore >= 75) score += 5
  if (place.dropInFriendly) score += 2
  if (place.beginnerFriendly) score += 2

  return clamp(score)
}

function calculatePhotoQualityScore(place) {
  const photoCount = (place.photos?.length || 0) + (place.mediaAssetCount || 0)
  let score = photoCount > 0 ? 35 : 0
  if (photoCount >= 2) score += 20
  if (photoCount >= 4) score += 20
  if (place.googlePlaceId && photoCount > 0) score += 15
  if (place.websiteUrl && photoCount > 0) score += 10
  return clamp(score)
}

function calculateReviewSentimentScore(place) {
  const rating = toNumber(place.googleRating)
  const count = place.googleReviewCount || place.reviewCount || 0
  if (rating <= 0 || count <= 0) return 0

  let score = Math.round((rating / 5) * 70)
  if (count >= 250) score += 25
  else if (count >= 75) score += 20
  else if (count >= 20) score += 15
  else score += 8
  return clamp(score)
}

function buildPros(place, trustScore, photoQualityScore, reviewSentimentScore) {
  const pros = []
  const rating = toNumber(place.googleRating)
  if (rating >= 4.5) pros.push(`Strong public rating (${rating.toFixed(1)})`)
  if ((place.googleReviewCount || 0) >= 50) pros.push('Enough public reviews to cross-check quality')
  if (photoQualityScore >= 65) pros.push('Venue photos available for visual inspection')
  if (place.websiteUrl) pros.push('Official website linked')
  if (place.dropInFriendly) pros.push('Likely workable for drop-ins')
  if (place.beginnerFriendly) pros.push('Beginner-friendly signal present')
  if (trustScore >= 80) pros.push('High confidence listing')
  if (reviewSentimentScore >= 80 && !pros.some((pro) => pro.includes('rating'))) {
    pros.push('Positive review signal')
  }

  return unique(pros).slice(0, 4)
}

function buildCons(place, trustScore, photoQualityScore, reviewCount) {
  const cons = []
  if (!place.websiteUrl) cons.push('Official website still needs confirmation')
  if (!place.googlePlaceId) cons.push('Google listing not matched yet')
  if (photoQualityScore < 45) cons.push('Needs fresher venue photos')
  if (reviewCount === 0 && (place.googleReviewCount || 0) === 0) {
    cons.push('No review volume available yet')
  }
  if (trustScore < 60) cons.push('Listing should stay under review until more sources are attached')
  if (cons.length === 0) cons.push('Current pricing and class schedule should still be checked before going')

  return unique(cons).slice(0, 4)
}

function humanizeTag(value) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function unique(values) {
  return [...new Set(values)]
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

module.exports = {
  buildPlaceIntelligence,
  calculatePhotoQualityScore,
  calculatePlaceTrustScore,
  calculateReviewSentimentScore,
}
