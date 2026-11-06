import { readFileSync, writeFileSync } from "node:fs";

const read = (name) =>
  JSON.parse(readFileSync(`mock/data/${name}.json`, "utf8"));
const write = (name, data) =>
  writeFileSync(`mock/data/${name}.json`, `${JSON.stringify(data, null, 2)}\n`);

const users = read("users");
const customers = read("customers");
const decks = read("clmDecks");
const kept = read("clmSessions").filter(
  (session) => !String(session.id).startsWith("g"),
);

const nameOf = new Map(users.map((user) => [user.id, user.name]));
for (const session of kept) {
  const customer = customers.find((item) => item.id === session.customerId);
  if (customer) session.repName = nameOf.get(customer.repId) ?? session.repName;
}

let seed = 20261106;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const between = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;

const reactions = ["interested", "question", "concern", "neutral"];
const lines = {
  interested: [
    "Asked how this fits their current choice.",
    "Agreed the next step.",
    "Wanted a leave-behind for the shelf.",
  ],
  question: [
    "Wanted the dosing line repeated.",
    "Asked about the pack size they already stock.",
    "Asked who else in the city is using it.",
  ],
  concern: [
    "Raised a safety point and paused.",
    "Worried about the reimbursement line.",
    "Said the price needs a second look.",
  ],
  neutral: [
    "Listened, no question.",
    "Took the card and moved on.",
    "No objection, no commitment.",
  ],
};
const notes = [
  "Wants the card before the next morning clinic.",
  "Ask about the second shelf card next visit.",
  "Bring the target card and book a follow-up.",
  "Delivery question, not a clinical one.",
  "Happy with the message. No follow-up needed.",
];

const days = [];
for (
  let d = new Date("2026-09-08T00:00:00Z");
  d <= new Date("2026-11-04T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1)
) {
  if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
    days.push(d.toISOString().slice(0, 10));
}

const sessions = [];
let count = 0;
for (const rep of users.filter((user) => user.role === "rep")) {
  const book = customers.filter(
    (customer) => customer.repId === rep.id && customer.status === "active",
  );
  const chosenDays = days.filter(() => chance(0.38)).slice(0, 16);
  for (const day of chosenDays) {
    const customer = pick(book);
    const deck = pick(decks);
    const shown = deck.slides.slice(0, between(3, deck.slides.length));
    let minute = 9 * 60 + between(0, 6) * 30;
    const started = new Date(`${day}T00:00:00Z`);
    started.setUTCMinutes(minute - 2 * 60);
    let elapsed = 0;
    const slides = shown.map((slide) => {
      const reaction = pick(reactions);
      const seconds = between(25, 90);
      elapsed += seconds;
      return {
        slideId: slide.id,
        seconds,
        reaction,
        feedback: pick(lines[reaction]),
      };
    });
    const ended = new Date(started.getTime() + elapsed * 1000);
    const followUp = chance(0.4);
    sessions.push({
      id: `g${++count}`,
      deckId: deck.id,
      customerId: customer.id,
      customerName: customer.name,
      repName: rep.name,
      startedAt: started.toISOString().replace(".000Z", "Z"),
      endedAt: ended.toISOString().replace(".000Z", "Z"),
      slides,
      followUp,
      note: followUp ? pick(notes) : pick(notes.slice(3)),
    });
  }
}

write(
  "clmSessions",
  [...kept, ...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
);
console.log(
  `${sessions.length} presentations added, ${kept.length} existing kept`,
);
