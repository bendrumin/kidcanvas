// Story templates to help parents capture meaningful moments
// These are organized by category and provide prompts for different types of stories

export interface StoryTemplate {
  id: string
  title: string
  category: 'milestone' | 'emotion' | 'learning' | 'play' | 'family' | 'seasonal'
  template: string
  prompts: string[]
  icon: string
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  // Milestone templates
  {
    id: 'first-time',
    title: 'First Time',
    category: 'milestone',
    template: 'Today [child name] made [describe artwork] for the first time! [What made it special?] [How did they react?]',
    prompts: [
      'What did they create for the first time?',
      'What made this moment special?',
      'How did they react to their creation?',
    ],
    icon: '🌟',
  },
  {
    id: 'new-skill',
    title: 'New Skill',
    category: 'milestone',
    template: '[Child name] learned to [new skill/technique] today! They were so [emotion] when they figured it out. [What they said or did next]',
    prompts: [
      'What new skill or technique did they learn?',
      'How did they feel when they figured it out?',
      'What did they say or do next?',
    ],
    icon: '🎯',
  },
  {
    id: 'growth-moment',
    title: 'Growth Moment',
    category: 'milestone',
    template: 'I can really see how [child name] has grown! Compared to [when/what], they can now [new ability]. This shows their progress in [skill area].',
    prompts: [
      'What change have you noticed?',
      'What can they do now that they couldn\'t before?',
      'What skill are they developing?',
    ],
    icon: '📈',
  },

  // Emotion templates
  {
    id: 'proud-moment',
    title: 'Proud Moment',
    category: 'emotion',
    template: '[Child name] was SO proud of this! They kept saying "[quote]" and wanted to show [who]. Their face just lit up when [what happened].',
    prompts: [
      'What did they say about their artwork?',
      'Who did they want to show it to?',
      'What made them feel proud?',
    ],
    icon: '🌈',
  },
  {
    id: 'frustration-breakthrough',
    title: 'Frustration to Breakthrough',
    category: 'emotion',
    template: 'At first, [child name] was frustrated because [challenge]. But then [what changed], and they figured it out! They learned that [lesson].',
    prompts: [
      'What was the challenge they faced?',
      'What helped them break through?',
      'What did they learn from this experience?',
    ],
    icon: '💪',
  },
  {
    id: 'joyful-creation',
    title: 'Pure Joy',
    category: 'emotion',
    template: 'While making this, [child name] was giggling and singing about [topic]. They said "[quote]" and their joy was just contagious! [Additional detail]',
    prompts: [
      'What were they singing or talking about?',
      'What did they say that made you smile?',
      'What else made this moment special?',
    ],
    icon: '😊',
  },

  // Learning templates
  {
    id: 'observation',
    title: 'Observation',
    category: 'learning',
    template: '[Child name] drew this after observing [what they saw]. They noticed [specific detail] and wanted to capture it. It shows they\'re learning about [concept].',
    prompts: [
      'What were they observing?',
      'What details did they notice?',
      'What are they learning?',
    ],
    icon: '👁️',
  },
  {
    id: 'question-exploration',
    title: 'Question Exploration',
    category: 'learning',
    template: '[Child name] has been asking about [topic/question]. This artwork is their way of exploring that idea. They said "[quote]" while making it.',
    prompts: [
      'What question or topic are they exploring?',
      'How does this artwork relate to their curiosity?',
      'What did they say while creating it?',
    ],
    icon: '❓',
  },
  {
    id: 'experimenting',
    title: 'Experimenting',
    category: 'learning',
    template: 'Today [child name] experimented with [materials/technique]. They discovered that [what they learned] and decided to [what they did with that knowledge].',
    prompts: [
      'What were they experimenting with?',
      'What did they discover?',
      'How did they use that discovery?',
    ],
    icon: '🔬',
  },

  // Play templates
  {
    id: 'imaginative-play',
    title: 'Imaginative Play',
    category: 'play',
    template: 'This is from [child name]\'s imaginary world where [describe the world/story]. They were pretending to be [character/role] and this [what the artwork represents].',
    prompts: [
      'What imaginary world were they creating?',
      'What role were they playing?',
      'What does this artwork represent in their story?',
    ],
    icon: '🦄',
  },
  {
    id: 'inspired-by',
    title: 'Inspired By',
    category: 'play',
    template: '[Child name] made this after [book/show/experience]. They loved [what they loved] and wanted to make their own version. They added [unique element].',
    prompts: [
      'What inspired this artwork?',
      'What did they love most about the inspiration?',
      'What unique elements did they add?',
    ],
    icon: '✨',
  },
  {
    id: 'gift-creation',
    title: 'Gift Creation',
    category: 'play',
    template: '[Child name] made this as a gift for [recipient] because [reason]. They put extra care into [specific element] and can\'t wait to give it to them.',
    prompts: [
      'Who is this gift for?',
      'Why did they want to make it for them?',
      'What special care did they put into it?',
    ],
    icon: '🎁',
  },

  // Family templates
  {
    id: 'family-moment',
    title: 'Family Moment',
    category: 'family',
    template: '[Child name] drew our family [doing what/where]. They included [special details] and said "[quote about family]". This captures [what it means].',
    prompts: [
      'What family moment are they capturing?',
      'What special details did they include?',
      'What does this show about your family?',
    ],
    icon: '❤️',
  },
  {
    id: 'together-time',
    title: 'Creating Together',
    category: 'family',
    template: '[Child name] and [family member] made this together. [Child name] did [their contribution] while [family member] helped with [their part]. They both loved [shared moment].',
    prompts: [
      'Who created this together?',
      'What did each person contribute?',
      'What moment did you share?',
    ],
    icon: '👨‍👩‍👧',
  },
  {
    id: 'memory-capture',
    title: 'Memory Capture',
    category: 'family',
    template: 'This artwork is [child name]\'s memory of [event/experience] with [people]. They especially remember [specific detail] and how it made them feel [emotion].',
    prompts: [
      'What event or experience is this capturing?',
      'Who was there?',
      'What specific detail do they remember?',
    ],
    icon: '📸',
  },

  // Seasonal templates
  {
    id: 'seasonal-art',
    title: 'Seasonal Creation',
    category: 'seasonal',
    template: '[Child name] made this to celebrate [season/holiday]. They focused on [elements] because [reason]. This captures the feeling of [what it captures].',
    prompts: [
      'What season or holiday inspired this?',
      'What elements did they focus on?',
      'What feeling does it capture?',
    ],
    icon: '🍂',
  },
  {
    id: 'weather-inspired',
    title: 'Weather Inspired',
    category: 'seasonal',
    template: 'After experiencing [weather], [child name] wanted to capture it in art. They said the [weather element] looked like [description] and made them think of [association].',
    prompts: [
      'What weather inspired this?',
      'How did they describe it?',
      'What associations did they make?',
    ],
    icon: '⛅',
  },
  {
    id: 'tradition',
    title: 'Family Tradition',
    category: 'seasonal',
    template: 'This artwork represents our family tradition of [tradition]. [Child name] included [meaningful elements] and is starting to understand that [what they\'re learning].',
    prompts: [
      'What family tradition is this about?',
      'What meaningful elements did they include?',
      'What are they learning about this tradition?',
    ],
    icon: '🎊',
  },
]

export const TEMPLATE_CATEGORIES = [
  { id: 'milestone', label: 'Milestones', icon: '🌟', description: 'Firsts, new skills, growth moments' },
  { id: 'emotion', label: 'Emotions', icon: '💖', description: 'Pride, joy, breakthroughs' },
  { id: 'learning', label: 'Learning', icon: '🧠', description: 'Observations, questions, experiments' },
  { id: 'play', label: 'Play', icon: '🎨', description: 'Imagination, inspiration, gifts' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', description: 'Together moments, memories' },
  { id: 'seasonal', label: 'Seasonal', icon: '🍂', description: 'Holidays, weather, traditions' },
] as const

export function getTemplatesByCategory(category: string): StoryTemplate[] {
  return STORY_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string): StoryTemplate | undefined {
  return STORY_TEMPLATES.find(t => t.id === id)
}
