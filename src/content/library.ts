// Write your own short stories here. Each entry in pages is one page.
export const library = {
  name: "The Nasal Library",
  welcome:
    "Pick a book and find a little adventure. Every story is free to read!",
};
export const books = [
  {
    id: "dragon-sneeze",
    title: "The Dragon Who Sneezed",
    emoji: "🐉",
    description: "A tiny dragon has a very surprising sneeze.",
    color: "#deebca",
    pages: [
      "Pip was a tiny dragon with a very tickly nose. One morning, he took a deep breath. ACHOO! A pink bubble floated out.",
      "Pip tried again. ACHOO! This time, three bubbles popped out. A mouse climbed onto a pebble to watch. ‘Can you make a big one?’ she asked.",
      "Pip sneezed one enormous bubble. It drifted over the town, shining like a rainbow. The mouse clapped. ‘You can bring the bubbles to my birthday!’ Pip grinned.",
    ],
  },
  {
    id: "moon-garden",
    title: "The Moon Garden",
    emoji: "🌙",
    description: "What grows when you plant a silver seed?",
    color: "#e6dff1",
    pages: [
      "Mila found a silver seed beside the garden gate. She tucked it into a pot, gave it some water, and set it by her window.",
      "Nothing happened all day. But when the moon rose, a little leaf unfolded. Then another! A flower opened with petals that glowed like stars.",
      "In the morning, the flower closed for a nap. Mila made a sign: ‘Moon Garden. Open after bedtime.’ That evening, she and her dad watched it wake up together.",
    ],
  },
  {
    id: "missing-sock",
    title: "The Missing Sock",
    emoji: "🧦",
    description: "Follow a trail to a cozy little mystery.",
    color: "#f8dfb9",
    pages: [
      "Sam had one yellow sock. Where was the other one? He looked under his bed. He found a toy boat, two crayons, and a very old cracker. No sock.",
      "He spotted a yellow thread by the door. Another thread led to the sofa. Sam bent down and heard a tiny squeak.",
      "There was his sock! A toy mouse was tucked inside it. His little sister waved. ‘Mouse needed a sleeping bag.’ Sam laughed and fetched a blanket. ‘Let’s build Mouse a whole house!’",
    ],
  },
] as const;
