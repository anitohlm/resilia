/**
 * Resilia Offline Emergency Knowledge Base
 * Authoritative disaster preparedness facts, river level thresholds,
 * emergency hotlines, and standard operating procedures for Marikina City and NDRRMC.
 */

export interface KnowledgeItem {
  id: string;
  topic: string;
  category: 'RIVER_LEVELS' | 'EVACUATION' | 'FIRST_AID' | 'HOTLINES' | 'WATER_SAFETY' | 'SHELTER_RULES';
  title: string;
  content: string;
  source: string;
  verifiedAt: string;
}

export const LOCAL_EMERGENCY_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'kn_marikina_river_levels',
    topic: 'Marikina River Alert System',
    category: 'RIVER_LEVELS',
    title: 'Marikina River Warning Alarm Protocol',
    content:
      'Level 0 (Below 15.0m): Normal condition. All gates monitored.\n' +
      'Level 1 (15.0m - Siren sounded for 1 minute): PREPARE. Communities in low-lying areas (Tumana, Malanday, Nangka) should pack emergency go-bags, charge radios, and review evacuation routes.\n' +
      'Level 2 (16.0m - Siren sounded for 2 minutes): PRE-EMPTIVE EVACUATION. Families with infants, senior citizens, pregnant women, and persons with disabilities must move to assigned barangay evacuation centers.\n' +
      'Level 3 (18.0m or higher - Siren continuous): FORCED EVACUATION. Critical hazard. All remaining residents must evacuate immediately. Responders deploy amphibious trucks and motorized rubber boats.',
    source: 'Marikina City Disaster Risk Reduction and Management Office (MCDRRMO)',
    verifiedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'kn_evacuation_bag',
    topic: 'Go Bag Checklist',
    category: 'EVACUATION',
    title: 'Emergency Go-Bag Necessities (72-Hour Kit)',
    content:
      'Pack: 1 gallon of potable water per person/day, ready-to-eat canned goods and biscuits, whistle, waterproof flashlight with extra batteries, whistle for signaling rescue, personal maintenance medicines (7-day supply), duplicate government IDs in waterproof pouch, warm clothing, hygiene essentials, and power bank.',
    source: 'National Disaster Risk Reduction and Management Council (NDRRMC)',
    verifiedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'kn_emergency_hotlines',
    topic: 'Emergency Contacts',
    category: 'HOTLINES',
    title: 'Marikina City & National Emergency Hotlines',
    content:
      '• Marikina Rescue 161 (Tel: 161 / (02) 8646-2436 to 38)\n' +
      '• Marikina CDRRMO: (02) 8927-1335 / (02) 8646-0427\n' +
      '• Barangay Tumana DRRM Desk: (02) 8942-0199\n' +
      '• Barangay Malanday Operation Center: (02) 8941-5522\n' +
      '• Philippine Red Cross Marikina Chapter: 143 / (02) 8681-3051\n' +
      '• Amang Rodriguez Memorial Medical Center: (02) 8941-5854\n' +
      '• Bureau of Fire Protection (BFP) Marikina: (02) 8646-0490',
    source: 'Marikina Emergency Communications Network',
    verifiedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'kn_wheelchair_accessibility',
    topic: 'Disability & Senior Citizen Access',
    category: 'SHELTER_RULES',
    title: 'Evacuation Center Accessibility Protocol',
    content:
      'Malanday Elementary School Main Building has ground-floor ramps, priority elderly/PWD triage rooms, and backup generator power for oxygen concentrators. Bulelak Covered Court is ground level with wide double doors. Responders prioritize ground-floor allocations for persons with mobility limitations.',
    source: 'Marikina Persons with Disability Affairs Office (PDAO)',
    verifiedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'kn_water_purification',
    topic: 'Drinking Water Disinfection',
    category: 'WATER_SAFETY',
    title: 'Safe Drinking Water in Flooded Conditions',
    content:
      'Never drink floodwater. If municipal piped water is disrupted, boil water vigorously for a full 1 to 3 minutes. Alternatively, add 2 drops of unscented household bleach (5-6% sodium hypochlorite) per 1 liter of clear water, stir, and wait 30 minutes before drinking.',
    source: 'Department of Health (DOH) Philippines',
    verifiedAt: '2026-10-12T00:00:00Z',
  },
];
