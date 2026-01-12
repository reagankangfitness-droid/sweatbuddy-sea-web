import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Initial waiver templates
const WAIVER_TEMPLATES = [
  {
    name: 'General Fitness Waiver',
    slug: 'general-fitness',
    description: 'Standard waiver for general fitness activities like running, HIIT, bootcamp, and gym workouts.',
    category: 'fitness',
    isDefault: true,
    content: `WAIVER AND RELEASE OF LIABILITY

I, the undersigned participant, acknowledge that I have voluntarily chosen to participate in this fitness activity. I understand that physical exercise can be strenuous and subject to risk of serious injury, illness, disability, or death.

ASSUMPTION OF RISK
I understand that participation in this fitness activity involves inherent risks, including but not limited to:
- Muscle strains, sprains, and other musculoskeletal injuries
- Cardiovascular stress and related conditions
- Dehydration and heat-related illness
- Slips, trips, and falls
- Contact with other participants or equipment

I voluntarily assume all risks associated with my participation in this activity.

RELEASE OF LIABILITY
In consideration of being permitted to participate in this activity, I hereby release, waive, and discharge the event organizer, host, and their affiliates from any and all liability, claims, demands, or causes of action that I may have arising out of or related to any injury, illness, disability, death, or property damage that may occur as a result of my participation.

FITNESS TO PARTICIPATE
I certify that:
- I am physically fit and have no medical condition that would prevent my safe participation
- I have consulted with a physician if I have any concerns about my ability to participate
- I will immediately notify the organizer of any health issues that arise during the activity

EMERGENCY MEDICAL TREATMENT
I authorize the organizer to seek emergency medical treatment on my behalf if needed, and I accept responsibility for any costs associated with such treatment.

By checking the agreement box below, I acknowledge that I have read this waiver, understand its contents, and agree to its terms.`,
  },
  {
    name: 'Outdoor Activity Waiver',
    slug: 'outdoor-activity',
    description: 'For outdoor activities like hiking, trail running, and outdoor bootcamps.',
    category: 'outdoor',
    isDefault: false,
    content: `OUTDOOR ACTIVITY WAIVER AND RELEASE OF LIABILITY

I, the undersigned participant, acknowledge that I have voluntarily chosen to participate in this outdoor fitness activity. I understand that outdoor activities carry additional risks beyond typical fitness activities.

ASSUMPTION OF RISK
I understand and accept the inherent risks of outdoor activities, including but not limited to:
- Uneven terrain, trail obstacles, and natural hazards
- Weather conditions (heat, cold, rain, wind, lightning)
- Wildlife encounters
- Limited access to emergency services
- Sun exposure and UV radiation
- Allergic reactions to plants, insects, or environmental factors
- Dehydration and heat exhaustion

I voluntarily assume all risks associated with my participation.

PERSONAL RESPONSIBILITY
I agree to:
- Bring appropriate gear, hydration, and sun protection
- Follow all instructions from the activity leader
- Stay with the group unless otherwise directed
- Notify the organizer immediately of any injury or illness
- Turn back if conditions become unsafe

RELEASE OF LIABILITY
In consideration of being permitted to participate, I hereby release, waive, and discharge the event organizer from any liability for injuries, illness, or property damage arising from my participation in this outdoor activity.

EMERGENCY PROCEDURES
I understand that in remote locations, emergency response may be delayed. I authorize the organizer to make decisions regarding my medical care in an emergency situation.

By checking the agreement box below, I acknowledge that I have read this waiver, understand its contents, and agree to its terms.`,
  },
  {
    name: 'Water Sports Waiver',
    slug: 'water-sports',
    description: 'For activities involving water like swimming, beach workouts, and water aerobics.',
    category: 'water',
    isDefault: false,
    content: `WATER ACTIVITY WAIVER AND RELEASE OF LIABILITY

I, the undersigned participant, acknowledge that I have voluntarily chosen to participate in this water-based fitness activity. I understand that activities in or around water carry significant risks.

ASSUMPTION OF RISK
I understand and accept the inherent risks of water activities, including but not limited to:
- Drowning or near-drowning incidents
- Water aspiration and respiratory distress
- Strong currents, waves, and tides
- Slippery surfaces in and around water
- Marine life encounters
- Hypothermia or cold water shock
- Waterborne illnesses

SWIMMING ABILITY
I certify that:
- I am a competent swimmer capable of swimming in open water conditions
- I have disclosed any medical conditions that may affect my safety in water
- I will use appropriate flotation devices if provided

SAFETY REQUIREMENTS
I agree to:
- Follow all instructions from the activity leader and lifeguards
- Stay within designated swimming areas
- Never swim alone or beyond my ability
- Exit the water immediately if I feel unwell or fatigued
- Report any safety concerns to the organizer

RELEASE OF LIABILITY
In consideration of being permitted to participate, I hereby release the event organizer from any liability for injuries or incidents arising from my participation in this water activity.

MEDICAL CONDITIONS
I have disclosed any medical conditions (including seizure disorders, heart conditions, or breathing problems) that may affect my safety in water activities.

By checking the agreement box below, I acknowledge that I have read this waiver, understand its contents, and agree to its terms.`,
  },
  {
    name: 'Combat Sports Waiver',
    slug: 'combat-sports',
    description: 'For martial arts, boxing, kickboxing, and other combat fitness activities.',
    category: 'combat',
    isDefault: false,
    content: `COMBAT SPORTS / MARTIAL ARTS WAIVER AND RELEASE OF LIABILITY

I, the undersigned participant, acknowledge that I have voluntarily chosen to participate in this combat sports/martial arts activity. I understand that these activities involve physical contact and carry higher risks of injury.

ASSUMPTION OF RISK
I understand and accept the inherent risks of combat sports activities, including but not limited to:
- Strikes, kicks, and impact injuries
- Joint locks and submission techniques causing sprains or dislocations
- Concussions and head injuries
- Cuts, bruises, and abrasions
- Broken bones and fractures
- Contact with training equipment

PHYSICAL CONTACT CONSENT
I understand that this activity involves physical contact with other participants, and I consent to such contact as part of the training. I agree to:
- Control my techniques and not use excessive force
- Stop immediately when my partner taps out or indicates distress
- Wear all required protective equipment
- Report any injuries immediately

TRAINING CONDUCT
I agree to:
- Follow all gym rules and instructor directions
- Train in a controlled and respectful manner
- Not engage in sparring beyond my skill level
- Disclose any previous injuries or medical conditions

RELEASE OF LIABILITY
In consideration of being permitted to participate, I hereby release the event organizer, instructors, and training partners from any liability for injuries arising from my participation in this combat sports activity.

PROTECTIVE EQUIPMENT
I understand that protective equipment (gloves, mouthguards, etc.) may be required and I will use them as directed.

By checking the agreement box below, I acknowledge that I have read this waiver, understand its contents, and agree to its terms.`,
  },
]

// POST /api/admin/seed-waivers - Seed initial waiver templates
export async function POST(request: Request) {
  try {
    // Simple admin check via header (in production, use proper auth)
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_SECRET_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = []

    for (const template of WAIVER_TEMPLATES) {
      // Check if template already exists
      const existing = await prisma.waiverTemplate.findUnique({
        where: { slug: template.slug }
      })

      if (existing) {
        results.push({ slug: template.slug, status: 'exists' })
        continue
      }

      // Create the template
      await prisma.waiverTemplate.create({
        data: template
      })

      results.push({ slug: template.slug, status: 'created' })
    }

    return NextResponse.json({
      success: true,
      message: 'Waiver templates seeded',
      results
    })
  } catch (error) {
    console.error('Error seeding waiver templates:', error)
    return NextResponse.json(
      { error: 'Failed to seed waiver templates' },
      { status: 500 }
    )
  }
}

// GET /api/admin/seed-waivers - Check seed status
export async function GET() {
  try {
    const count = await prisma.waiverTemplate.count()
    const templates = await prisma.waiverTemplate.findMany({
      select: { slug: true, name: true, isDefault: true }
    })

    return NextResponse.json({
      count,
      templates,
      expectedCount: WAIVER_TEMPLATES.length
    })
  } catch (error) {
    console.error('Error checking waiver templates:', error)
    return NextResponse.json(
      { error: 'Failed to check waiver templates' },
      { status: 500 }
    )
  }
}

