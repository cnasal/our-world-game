// Add a lesson here with short questions, choices, a correct answer, and a hint.
export const school = {
  name: "The Nasal School",
  welcome:
    "Pick something to explore. Take your time, and try again whenever you like!",
};
export const schoolStations = [
  {
    id: "lesson:math",
    name: "Math desk",
    lessonId: "math",
    x: 480,
    y: 530,
    color: 0xd9b36d,
  },
  {
    id: "lesson:words",
    name: "Reading desk",
    lessonId: "words",
    x: 960,
    y: 530,
    color: 0xa99cbe,
  },
  {
    id: "lesson:history",
    name: "History desk",
    lessonId: "history",
    x: 480,
    y: 720,
    color: 0xc88e77,
  },
  {
    id: "lesson:nature",
    name: "Nature desk",
    lessonId: "nature",
    x: 960,
    y: 720,
    color: 0x8fae86,
  },
] as const;
export const lessons = [
  {
    id: "math",
    name: "Number fun",
    emoji: "🔢",
    description: "Count, add, and share.",
    color: "#f8dfb9",
    questions: [
      {
        prompt:
          "You have 3 apples and find 2 more. How many apples do you have?",
        choices: ["4", "5", "6"],
        answer: "5",
        hint: "Start at 3 and count two more: 4, 5.",
        explanation: "3 + 2 = 5 apples!",
      },
      {
        prompt: "What number comes next: 2, 4, 6, ...?",
        choices: ["7", "10", "8"],
        answer: "8",
        hint: "Each number is two more than the last.",
        explanation: "Counting by twos goes 2, 4, 6, 8!",
      },
      {
        prompt:
          "Share 12 strawberries equally between 3 bowls. How many go in each bowl?",
        choices: ["4", "3", "6"],
        answer: "4",
        hint: "Try adding 4 + 4 + 4.",
        explanation: "Three bowls with 4 strawberries each make 12.",
      },
    ],
  },
  {
    id: "words",
    name: "Reading fun",
    emoji: "✏️",
    description: "Read a little story and play with words.",
    color: "#e6dff1",
    questions: [
      {
        prompt: "Which word rhymes with cat?",
        choices: ["Dog", "Hat", "Cup"],
        answer: "Hat",
        hint: "Say the words aloud. Listen for the same ending sound.",
        explanation: "Cat and hat both end with the sound ‘at’.",
      },
      {
        prompt:
          "Mia put on her boots. She took an umbrella and splashed in a puddle. What was the weather like?",
        choices: ["Rainy", "Snowy", "Dry"],
        answer: "Rainy",
        hint: "An umbrella keeps you dry. What makes puddles?",
        explanation: "The umbrella and puddle are clues that it was rainy.",
      },
      {
        prompt: "Which word is an action in ‘The rabbit hops’?",
        choices: ["Rabbit", "Hops", "The"],
        answer: "Hops",
        hint: "Which word tells you what the rabbit does?",
        explanation:
          "Hops tells us what the rabbit does. An action word is called a verb.",
      },
    ],
  },
  {
    id: "history",
    name: "Time travelers",
    emoji: "🏺",
    description: "Find clues about long ago.",
    color: "#f6dfd6",
    questions: [
      {
        prompt: "Which could tell us about a child's life 100 years ago?",
        choices: ["Their old diary", "Tomorrow's lunch", "A blank page"],
        answer: "Their old diary",
        hint: "A diary can tell us what someone did and thought.",
        explanation:
          "Old diaries are clues about how people lived in the past.",
      },
      {
        prompt: "Which was invented first?",
        choices: ["Smartphones", "Steam trains", "Video games"],
        answer: "Steam trains",
        hint: "People rode steam trains long before pocket computers existed.",
        explanation: "Steam trains came before video games and smartphones.",
      },
      {
        prompt:
          "An archaeologist finds an old clay bowl. What can it help us learn about?",
        choices: [
          "Next week's weather",
          "Life long ago",
          "Tomorrow's football score",
        ],
        answer: "Life long ago",
        hint: "Archaeologists study things people left behind.",
        explanation:
          "Objects like bowls can give us clues about everyday life in the past.",
      },
    ],
  },
  {
    id: "nature",
    name: "Nature explorers",
    emoji: "🌱",
    description: "Meet plants and little creatures.",
    color: "#deebca",
    questions: [
      {
        prompt: "What does a caterpillar become?",
        choices: ["A frog", "A bird", "A butterfly or moth"],
        answer: "A butterfly or moth",
        hint: "Its grown-up form has wings with tiny scales.",
        explanation: "Caterpillars grow into butterflies or moths!",
      },
      {
        prompt: "Which part of a plant takes in water from the soil?",
        choices: ["Roots", "Petals", "Fruit"],
        answer: "Roots",
        hint: "Look under the ground.",
        explanation: "Roots take in water and help hold the plant in place.",
      },
      {
        prompt: "How many legs does an ant have?",
        choices: ["4", "8", "6"],
        answer: "6",
        hint: "An ant has three pairs of legs. Each pair has two.",
        explanation: "Ants are insects. Insects have six legs.",
      },
    ],
  },
] as const;
