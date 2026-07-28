# Singapore Community Directory Aggregation

Last checked: 2026-07-22
Market: Singapore
Purpose: first non-build aggregation pass for testing SweatBuddies as a trusted directory for joinable fitness communities.

## Decision

Start the experiment as a community directory, not a broad events marketplace and not a fully real-time hosting platform.

The user-facing promise should be:

> Find active fitness communities near you that you can confidently join.

This is tighter than "fitness activities near you" because it solves the real anxiety: users do not just need listings, they need to know whether they can show up solo, whether beginners are welcome, where to join, and whether the group is still active.

## What We Should Trim

- Trim generic wellness categories unless they have a recurring, public, joinable community.
- Trim one-off paid classes unless they are clearly attached to a recurring community or social crew.
- Trim pure gyms and studios unless the listing is for a community session, club, run, hike, open play, or social workout.
- Trim vague host/session creation as the primary experience until we know which community categories create repeated demand.
- Keep the ability to submit or claim a community, but keep full hosting tools secondary for now.

## Aggregation Fields

Minimum fields for the test:

- Name
- Activity category
- City/area
- Official source
- Public join link
- Social link
- Schedule signal
- Beginner or solo signal
- Free/paid signal
- Freshness signal
- Confidence tier
- Publish action
- Notes

## Confidence Tiers

- Publishable: official source or active public group, clear join path, and enough information for a solo user to decide.
- Needs review: credible candidate, but needs manual confirmation of schedule, beginner policy, activity freshness, or official link.
- Candidate only: useful lead, but not enough for public listing.
- Hold: not aligned with the directory promise, too private, too commercial-only, student-only, members-only without a clear path, or stale.

## First Aggregation Pass

| # | Candidate | Category | Area | Tier | Action | Join path signal | Notes |
|---:|---|---|---|---|---|---|---|
| 1 | Fast and Free Running Club | Run club | Singapore | Publishable | Add | Official site and directory source | Strong community brand; public run club fit. |
| 2 | Running Department | Run club | CBD / Singapore | Publishable | Add | Official/directory source | Strong local recognition; validate current weekly schedule before launch. |
| 3 | Singapore Runners Club | Run club | Singapore | Publishable | Add | Public link hub / social | Broad audience; good beginner-facing candidate if schedule is clear. |
| 4 | Zephyr Running Club | Run club | Singapore | Publishable | Add | Official site | Good dedicated club profile candidate. |
| 5 | MR25 | Run club | MacRitchie / Singapore | Publishable | Add | Official club site | Clear community identity; likely more experienced trail/road runners. |
| 6 | Ridge Runners | Run club | Singapore | Publishable | Add | Official/social source | Strong niche for trail/community running. |
| 7 | Singapore FrontRunners | Run club | Singapore | Needs review | Review | Directory/social source | Important inclusive/LGBTQ+ community candidate; verify official current join path. |
| 8 | ASICS Running Club Singapore | Brand run club | Singapore | Needs review | Review | Official brand/community source | Useful if current sessions are recurring and public. |
| 9 | Garmin Run Club Singapore | Brand run club | Singapore | Needs review | Review | Official/community source | Good recurring training candidate; verify current public registration. |
| 10 | adidas Runners Singapore | Brand run club | Singapore | Needs review | Review | Official/community source | Strong brand community; verify local chapter activity. |
| 11 | PUMA Nitro Run Club Singapore | Brand run club | Singapore | Needs review | Review | Directory/social source | Good candidate if current and open. |
| 12 | lululemon Run Club Singapore | Brand run club | Singapore | Needs review | Review | Directory/social source | Good premium audience fit if events are public. |
| 13 | New Balance Run Club Singapore | Brand run club | Singapore | Needs review | Review | Directory/social source | Verify recurring activity and official link. |
| 14 | Run.JPG | Run club | Singapore | Needs review | Review | Directory/social source | Modern social run club; verify public join path. |
| 15 | OFF:FORM | Run club | Singapore | Needs review | Review | Directory/social source | Differentiated identity; verify schedule and welcome signal. |
| 16 | The High Panters | Run club | Singapore | Needs review | Review | Directory/social source | Social/community angle; verify freshness. |
| 17 | The Social Running Club | Run club | Singapore | Needs review | Review | Directory/social source | Name maps directly to SweatBuddies use case; verify source. |
| 18 | Super Hero Runners | Run club | Singapore | Needs review | Review | Directory/social source | Potential beginner/social audience; verify current activity. |
| 19 | Volt Runners SG | Run club | Singapore | Needs review | Review | Directory/social source | Good candidate for social run filtering. |
| 20 | Rundays Fundays | Run club | Singapore | Needs review | Review | Directory/social source | Good casual-positioned candidate; verify schedule. |
| 21 | Easy Pace Run Club | Run club | Singapore | Needs review | Review | Directory/social source | Strong beginner/low-pressure positioning if current. |
| 22 | Urban Milers | Run club | Singapore | Needs review | Review | Directory/social source | Add if schedule and public social link validate. |
| 23 | XTrailBlazers | Trail running | Singapore | Needs review | Review | Directory/social source | Useful trail-running filter candidate. |
| 24 | SSTAR Fitness | Running / fitness | Singapore | Needs review | Review | Directory/social source | Validate whether this is community-led or coaching-led. |
| 25 | Team Hustlers | Run club | Singapore | Needs review | Review | Directory/social source | Validate current activity and public link. |
| 26 | Big Boyz Run Club | Run club | Singapore | Needs review | Review | Directory/social source | Strong niche identity; verify solo/beginner policy. |
| 27 | Beyond Miles Club | Run club | Singapore | Needs review | Review | Directory/social source | Good candidate if recurring and open. |
| 28 | Mountain Goat Running Group | Run club | Singapore | Needs review | Review | Directory/social source | Add if official link and schedule are current. |
| 29 | SAFRA Running Club | Run club | Singapore | Hold | Hold | Members/community source | Useful but likely member-linked; label clearly if added. |
| 30 | FitFam Singapore | Outdoor fitness | Singapore | Publishable | Add | Official/community source | Strong match: public recurring fitness community, not just a gym. |
| 31 | Punggol Fit Club | Outdoor fitness | Punggol | Publishable | Add | Official/community source | Hyperlocal, community-led, good for area filters. |
| 32 | SG Fitclub | Outdoor fitness | Singapore | Needs review | Review | Public community source | Validate whether current, open, and beginner-friendly. |
| 33 | Fitness Bravo | Bootcamp / fitness | Singapore | Needs review | Review | Official/social source | Good paid/community hybrid if recurring social workouts exist. |
| 34 | The Daily Movement | Outdoor fitness | Singapore | Needs review | Review | Social/source lookup needed | Include only if community sessions are public and recurring. |
| 35 | Caliversity Singapore | Calisthenics | Singapore | Candidate only | Research | Public content/source lookup needed | Potential niche; needs official local community source. |
| 36 | Actualize Fitness community sessions | Outdoor fitness | Singapore | Candidate only | Research | Commercial/community source | Add only if there is a clear social/community session. |
| 37 | MSFIT | Fitness / women-focused | Singapore | Candidate only | Research | Social/source lookup needed | Potential differentiated women-focused community. |
| 38 | Bombshell Body community workouts | Dance fitness | Singapore | Candidate only | Research | Commercial/community source | Potential if community angle is explicit. |
| 39 | SHiNE Dance Fitness Singapore | Dance fitness | Singapore | Candidate only | Research | Brand/community source | Add if local community/social sessions are findable. |
| 40 | Yoga for a Change | Yoga | Singapore | Publishable | Add | Official site / social source | Strong mission-led recurring yoga community. |
| 41 | Yoga Seeds | Outdoor yoga | Singapore | Publishable | Add | Official source | Useful for wellness category if sessions are public and recurring. |
| 42 | Singapore Free Meditation | Meditation | Singapore | Needs review | Review | Public Meetup source | Good free wellness candidate; verify current upcoming schedule. |
| 43 | Meditate Singapore | Meditation | Singapore | Publishable | Add | Official site | Good low-barrier wellness community if schedule is current. |
| 44 | The Intentional Pause | Meditation / wellness | Singapore | Needs review | Review | Official source | Useful emotional-health angle; verify join flow. |
| 45 | Pa-Auk Meditation Centre Singapore | Meditation | Singapore | Needs review | Review | Official/community source | Add only if general public and beginner pathway are clear. |
| 46 | Tibetan Buddhist Meditation in Singapore | Meditation | Singapore | Candidate only | Research | Public group source | Use caution: religious context should be clear and optional. |
| 47 | Singapore Pickleball Meetup Group | Pickleball | Singapore | Publishable | Add | Public Meetup source | Strong open-play style candidate. |
| 48 | Pickleball Social Crew | Pickleball | Singapore | Publishable | Add | Public Meetup source | Strong community/event fit. |
| 49 | PickleConnect at PWBR | Pickleball | Singapore | Publishable | Add | Public Meetup/source | Useful if public sessions and pricing are clear. |
| 50 | Drop & Reset Pickleball Social Club | Pickleball | Singapore | Publishable | Add | Public Meetup/social source | Good social-first name and likely directory fit. |
| 51 | Singapore Pickleball Association | Pickleball | Singapore | Needs review | Review | Official association source | Best used as verification/source hub, not necessarily a community card. |
| 52 | Padel Singapore | Padel | Singapore | Publishable | Add | Official source | Clear activity hub; verify social open-play products. |
| 53 | Play! Padel | Padel | Singapore | Publishable | Add | Official source | Add if public open-play/social sessions are available. |
| 54 | Singpadel Socials | Padel | Singapore | Needs review | Review | Social/source lookup needed | Strong candidate for social racquet sports; verify official link. |
| 55 | Play! Tennis | Tennis | Singapore | Publishable | Add | Official source | Public social tennis fit if recurring sessions are clear. |
| 56 | Singapore Social Badminton | Badminton | Singapore | Publishable | Add | Public Meetup source | Good casual/social sports candidate. |
| 57 | Singapore Volleyball Meetup | Volleyball | Singapore | Publishable | Add | Public Meetup source | Good social team-sport candidate. |
| 58 | Football Pickup Games Singapore | Football | Singapore | Publishable | Add | Public Meetup/source | Strong "join activity near you" proof point. |
| 59 | ONE Volleyball | Volleyball | Singapore | Candidate only | Research | Source lookup needed | Potential but verify public join path and community status. |
| 60 | Rapha Cycling Club Singapore | Cycling | Singapore | Publishable | Add | Official/Strava/community source | Premium cycling community; may require membership/registration. |
| 61 | ANZA Cycling | Cycling | Singapore | Publishable | Add | Official club source | Clear club, recurring rides, but label membership and rider level. |
| 62 | FIVE45 Cycling Club | Cycling | Singapore | Publishable | Add | Official/source signal | Strong local cycling club candidate; verify public join process. |
| 63 | Joyriders Singapore | Cycling | Singapore | Needs review | Review | Source lookup needed | Known local social rides; needs current official source. |
| 64 | Felis Velos | Cycling | Singapore | Needs review | Review | Directory/source lookup needed | Potential niche cycling community. |
| 65 | NBAS Cycling | Cycling | Singapore | Needs review | Review | Source lookup needed | Add only if public rides and join path are clear. |
| 66 | Decathlon x CTCC Social Ride | Cycling | Singapore | Candidate only | Research | Event/source signal | Could be event-led rather than community-led. |
| 67 | SGTREK | Hiking / outdoors | Singapore | Publishable | Add | Official source | Strong outdoor/hiking inventory, but classify as guided/commercial if needed. |
| 68 | Adventure Lovers Meetup Singapore | Hiking / outdoors | Singapore | Publishable | Add | Public Meetup source | Strong open community fit. |
| 69 | Singapore Adventurous Nature-Lovers | Hiking / outdoors | Singapore | Publishable | Add | Public Meetup source | Good public hiking/walking community fit. |
| 70 | eXplorerSG Walk-Talk-eAT | Walking / outdoors | Singapore | Publishable | Add | Public Meetup source | Good social walking/outdoors fit. |
| 71 | I Walk I Hike I Eat I Travel | Walking / hiking | Singapore | Needs review | Review | Public group source | Good casual signal; verify current public join path. |
| 72 | ANZA Kill-o-Metres | Walking / running | Singapore | Hold | Hold | Member/community source | May be member-limited; hold unless public path is clear. |
| 73 | BoulderKakis | Climbing | Singapore | Publishable | Add | Public/community source | Strong social climbing candidate if active link validates. |
| 74 | Boulder Without Borders | Climbing | Singapore | Publishable | Add | Public/community source | Good inclusive/social positioning. |
| 75 | Climbing.sg | Climbing | Singapore | Needs review | Review | Directory/community source | Better as source hub unless it has joinable events. |
| 76 | Singapore Indoor Climbing Meetup | Climbing | Singapore | Candidate only | Research | Meetup/source signal | Verify activity freshness before public listing. |
| 77 | Queer Joy Climbing | Climbing | Singapore | Needs review | Review | Public/social source | Strong inclusive niche; verify schedule and official link. |
| 78 | Boulder Planet community events | Climbing | Singapore | Candidate only | Research | Venue/source signal | Venue-led, add only for public community sessions. |
| 79 | MetaSport training community | Triathlon | Singapore | Publishable | Add | Official source | Strong endurance/wellness bridge; validate beginner pathway. |
| 80 | Triathlon Singapore affiliated clubs | Triathlon | Singapore | Needs review | Review | Official association source | Use as source hub for club discovery, not as a user-facing card. |
| 81 | Singapore Women's Triathlon Club | Triathlon | Singapore | Needs review | Review | Association/source lookup | Strong niche if still active and open. |
| 82 | B2TW | Triathlon | Singapore | Needs review | Review | Association/source lookup | Validate current public join path. |
| 83 | Tribal Triathlon | Triathlon | Singapore | Needs review | Review | Association/source lookup | Validate current public join path. |
| 84 | WellBred | Triathlon | Singapore | Needs review | Review | Association/source lookup | Validate current public join path. |

## Publishable Seed Set

The first public seed should not include all 84 candidates. Start with 35 to 45 listings that satisfy three things:

- clear public join path
- recurring activity signal
- useful decision metadata for solo/beginner users

Recommended launch mix:

- 12 to 15 run clubs
- 4 to 5 outdoor fitness or bootcamp communities
- 3 to 5 yoga or meditation communities
- 6 to 8 racquet/social sports communities
- 4 to 5 cycling/outdoor communities
- 3 to 5 hiking/walking communities
- 2 to 4 climbing or triathlon communities

## Differentiation Layer

Do not compete by having the largest list. Compete by making the decision easier.

Each listing should answer:

- Can I show up alone?
- Are beginners welcome?
- Is this free, paid, or member-only?
- Where do I join officially?
- When do they usually meet?
- Is this recently active?
- What kind of person will feel comfortable here?

## Recommended Next Phase

1. Manually verify the 45 best publishable candidates.
2. Add official social links only when they are public and intended for joining.
3. Write one-line "best for" copy per listing.
4. Add confidence labels: Active, Beginner-friendly, Solo-friendly, Free, Paid, Member-only, Needs schedule check.
5. Do outreach to 25 community owners with a claim/update link.
6. Measure outbound join clicks, saves, claims, reports, and repeat visits for 30 days.

## Source Register

- Fitness In SG run club directory: https://fitnessinsg.com/singapore-run-clubs/
- Fast and Free Running Club: https://www.fastandfree.sg/
- Zephyr Running Club: https://www.zephyrrunningclub.com/
- MR25: https://mr25.org.sg/
- FitFam Singapore: https://www.wefitfam.com/
- Punggol Fit Club: https://www.punggolfitclub.com/
- Yoga for a Change: https://www.yogaforachange.com/
- Yoga Seeds: https://www.yogaseeds.com.sg/
- Meditate Singapore: https://www.meditateinsingapore.org/
- Singapore Pickleball Meetup examples: https://www.meetup.com/
- Padel Singapore: https://padel.sg/
- Play! Tennis: https://playtennis.sg/
- Rapha Singapore: https://www.rapha.cc/
- ANZA Cycling: https://anza.org.sg/sports/cycling/
- FIVE45 Cycling Club: https://five45.cc/
- SGTREK: https://sgtrek.com/
- Singapore hiking and outdoors Meetup examples: https://www.meetup.com/
- Boulder Without Borders: https://www.boulderwithoutborders.com/
- BoulderKakis: https://www.boulderkakis.com/
- Climbing.sg: https://climbing.sg/
- MetaSport: https://www.metasport.com/
- Triathlon Singapore: https://www.triathlonsingapore.org/

