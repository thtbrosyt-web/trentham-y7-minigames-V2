export const LESSON_ROUNDS = [
  {
    lesson: "Maths",
    timeLimit: 28,
    items: [
      { id: "calc", name: "Calculator", emoji: "🧮", required: true },
      { id: "ruler", name: "Ruler", emoji: "📏", required: true },
      { id: "pencil", name: "Pencil", emoji: "✏️", required: true },
      { id: "boots", name: "Football Boots", emoji: "🥾", required: false },
      { id: "whistle", name: "Whistle", emoji: "📢", required: false },
      { id: "paint", name: "Paint Set", emoji: "🎨", required: false }
    ]
  },
  {
    lesson: "PE",
    timeLimit: 24,
    items: [
      { id: "kit", name: "PE Kit", emoji: "👕", required: true },
      { id: "trainers", name: "Trainers", emoji: "👟", required: true },
      { id: "water", name: "Water Bottle", emoji: "🧴", required: true },
      { id: "compass", name: "Compass", emoji: "🧭", required: false },
      { id: "book", name: "Reading Book", emoji: "📚", required: false },
      { id: "markers", name: "Markers", emoji: "🖍️", required: false }
    ]
  },
  {
    lesson: "Science",
    timeLimit: 26,
    items: [
      { id: "labbook", name: "Lab Book", emoji: "📓", required: true },
      { id: "goggles", name: "Safety Goggles", emoji: "🥽", required: true },
      { id: "pen", name: "Pen", emoji: "🖊️", required: true },
      { id: "shinguards", name: "Shin Guards", emoji: "🦵", required: false },
      { id: "flute", name: "Flute", emoji: "🎶", required: false },
      { id: "canvas", name: "Sketch Canvas", emoji: "🖼️", required: false }
    ]
  },
  {
    lesson: "Art",
    timeLimit: 25,
    items: [
      { id: "brush", name: "Paint Brush", emoji: "🖌️", required: true },
      { id: "palette", name: "Palette", emoji: "🎨", required: true },
      { id: "apron", name: "Apron", emoji: "🧥", required: true },
      { id: "stopwatch", name: "Stopwatch", emoji: "⏱️", required: false },
      { id: "protractor", name: "Protractor", emoji: "📐", required: false },
      { id: "ball", name: "Tennis Ball", emoji: "🎾", required: false }
    ]
  }
];

export const INTRO_LINE = "Innovation is key. Keep learning, keep building.";
