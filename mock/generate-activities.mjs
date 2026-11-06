import { readFileSync, writeFileSync } from "node:fs";

const read = (name) =>
  JSON.parse(readFileSync(`mock/data/${name}.json`, "utf8"));
const write = (name, data) =>
  writeFileSync(`mock/data/${name}.json`, `${JSON.stringify(data, null, 2)}\n`);

const users = read("users");
const customers = read("customers");
// Generated records carry a `g` id prefix, so a rerun replaces them and keeps the hand-written ones.
const baseActivities = read("activities").filter((a) => !a.id.startsWith("g"));
const baseVisits = read("visits").filter((v) => !v.id.startsWith("g"));

const FROM = "2026-09-07";
const TO = "2026-12-18";
const TODAY = new Date("2026-11-05T09:30:00Z");
const HOLIDAYS = new Set(["2026-10-28"]);

let seed = 20261105;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const chance = (p) => rand() < p;
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => min + Math.floor(rand() * (max - min + 1));
/** Calendar times stay on five-minute marks. */
const gap = (min, max) => 5 * between(min / 5, max / 5);
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Athens is UTC+3 until the last Sunday of October, UTC+2 after. */
function toUtc(day, minutes) {
  const offset = day < "2026-10-25" ? 3 : 2;
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCMinutes(minutes - offset * 60);
  return date.toISOString().replace(".000Z", "Z");
}

function workdays() {
  const days = [];
  for (
    let d = new Date(`${FROM}T00:00:00Z`);
    d <= new Date(`${TO}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const iso = d.toISOString().slice(0, 10);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6 && !HOLIDAYS.has(iso))
      days.push(iso);
  }
  return days;
}
const weekday = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();

const firstName = (person) => person.name.split(" ")[0];
const customersOf = (repId) => customers.filter((c) => c.repId === repId);
const repsOf = (managerId) =>
  users.filter((u) => u.role === "rep" && u.managerId === managerId);
const keyAccounts = (list) =>
  list.filter(
    (c) => c.type === "Hospital" || c.type === "Eopyy" || c.type === "Clinic",
  );

const visitNotes = {
  Pharmacy: [
    "Ελέγξτε το ράφι και τη θέση της κάρτας προϊόντος.",
    "Παρουσιάστε τη χειμερινή σειρά. Αφήστε δείγματα.",
    "Ρωτήστε για την προσφορά του μήνα και τη διαθεσιμότητα.",
    "Ο φαρμακοποιός ζήτησε νέο τιμοκατάλογο.",
    "Συζητήστε αναπλήρωση πριν τις γιορτές.",
    "Δείξτε το νέο βοήθημα της βιταμίνης D.",
  ],
  Clinic: [
    "Συνάντηση με τον επιστημονικό υπεύθυνο. Φέρτε την περίληψη μελέτης.",
    "Ρωτήστε πώς πήγε η δοκιμή των δειγμάτων.",
    "Παρουσίαση για τη δοσολογία σε ηλικιωμένους.",
  ],
  Hospital: [
    "Ραντεβού με τον διευθυντή καρδιολογικής.",
    "Συζήτηση για τον διαγωνισμό του νοσοκομείου.",
    "Επίσκεψη στο φαρμακείο του νοσοκομείου για αποθέματα.",
  ],
  Eopyy: [
    "Ενημέρωση για τη νέα λίστα αποζημίωσης.",
    "Ελέγξτε τις εκκρεμείς εγκρίσεις.",
  ],
};
const callNotes = [
  "Επιβεβαιώστε την παραγγελία της εβδομάδας.",
  "Follow-up μετά την τελευταία επίσκεψη.",
  "Ρωτήστε αν έφτασε η παράδοση.",
  "Κλείστε το επόμενο ραντεβού.",
  "Εκκρεμεί απάντηση για την έκπτωση όγκου.",
  undefined,
  undefined,
];
const cancelNotes = [
  "Ο πελάτης ακύρωσε. Μετάθεση για την επόμενη εβδομάδα.",
  "Το φαρμακείο ήταν κλειστό.",
  "Ο γιατρός είχε χειρουργείο.",
  "Κίνηση στον δρόμο, δεν προλάβαμε.",
];
const repTasks = [
  "Ενημέρωση στοιχείων επαφής πελατών",
  "Αποστολή τιμοκαταλόγου",
  "Παραγγελία δειγμάτων",
  "Καταχώριση εξόδων",
  "Προετοιμασία παρουσίασης CLM",
];
const managerTasks = [
  "Έγκριση εξόδων ομάδας",
  "Ανασκόπηση εβδομαδιαίων αναφορών",
  "Ενημέρωση forecast πωλήσεων",
  "Προετοιμασία πλάνου κύκλου",
  "Αξιολόγηση στόχων ομάδας",
];

const activities = [];
const visits = [];
let activityCount = 0;
let visitCount = 0;

const busy = new Set(
  baseActivities.map((a) => `${a.repId}|${a.start.slice(0, 10)}`),
);

function statusFor(endIso) {
  if (new Date(endIso) > TODAY) return "planned";
  return chance(0.08) ? "cancelled" : "done";
}

function add(person, day, startMin, length, fields) {
  const start = toUtc(day, startMin);
  const end = toUtc(day, startMin + length);
  const status = fields.status ?? statusFor(end);
  const activity = {
    id: `g${++activityCount}`,
    type: fields.type,
    title: fields.title,
    ...(fields.customerId ? { customerId: fields.customerId } : {}),
    repId: person.id,
    repName: person.name,
    start,
    end,
    status,
  };
  const notes =
    status === "cancelled" && fields.type !== "task"
      ? pick(cancelNotes)
      : fields.notes;
  if (notes) activity.notes = notes;
  activities.push(activity);
  return activity;
}

function checkIn(person, activity, customer) {
  const far = chance(0.05);
  const meters = far ? between(350, 1600) : between(5, 70);
  const angle = rand() * 2 * Math.PI;
  const lat = customer.latitude + (meters * Math.cos(angle)) / 111320;
  const lng =
    customer.longitude +
    (meters * Math.sin(angle)) /
      (111320 * Math.cos((customer.latitude * Math.PI) / 180));
  const checkedIn = new Date(activity.start);
  checkedIn.setUTCMinutes(checkedIn.getUTCMinutes() + between(-5, 12));
  const visit = {
    id: `g${++visitCount}`,
    customerId: customer.id,
    repId: person.id,
    repName: person.name,
    checkedInAt: checkedIn.toISOString().replace(".000Z", "Z"),
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    accuracy: between(5, far ? 60 : 35),
    distanceToCustomer: meters,
  };
  visits.push(visit);
  activity.visitId = visit.id;
}

/** Most of the day stays in one city, the rest fills from the wider book. */
function dayRoute(book, size) {
  const active = book.filter((c) => c.status === "active" || chance(0.15));
  if (active.length === 0) return [];
  const city = pick(active).city;
  const local = shuffle(active.filter((c) => c.city === city));
  const others = shuffle(active.filter((c) => c.city !== city));
  return [...local, ...others].slice(0, size);
}

function visitLength(customer) {
  return customer.type === "Hospital"
    ? 60
    : customer.type === "Pharmacy"
      ? 30
      : 45;
}

function planRep(rep, day) {
  const book = customersOf(rep.id);
  if (book.length === 0) return;
  const manager = users.find((u) => u.id === rep.managerId);
  const dow = weekday(day);
  const regional = manager?.id === "m2";
  let clock = 9 * 60;

  if (dow === 1) {
    add(rep, day, clock, 60, {
      type: "meeting",
      title: `Εβδομαδιαία συνάντηση ομάδας (${firstName(manager)})`,
      notes: "Online. Στόχοι εβδομάδας και εκκρεμότητες.",
    });
    clock += 90;
  }

  const size = regional ? between(3, 4) : between(4, 5);
  for (const customer of dayRoute(book, dow === 1 ? size - 1 : size)) {
    const length = visitLength(customer);
    const activity = add(rep, day, clock, length, {
      type: "visit",
      title: `Visit: ${customer.name}`,
      customerId: customer.id,
      notes: chance(0.45)
        ? pick(visitNotes[customer.type] ?? visitNotes.Pharmacy)
        : undefined,
    });
    if (activity.status === "done" && chance(0.92))
      checkIn(rep, activity, customer);
    clock += length + (regional ? gap(30, 75) : gap(15, 45));
  }

  let afternoon = Math.max(clock, 14 * 60) + between(0, 2) * 15;
  for (let i = between(1, 3); i > 0; i--) {
    const customer = pick(book);
    add(rep, day, afternoon, 20, {
      type: "call",
      title: `Call: ${customer.name}`,
      customerId: customer.id,
      notes: pick(callNotes),
    });
    afternoon += gap(30, 60);
  }

  if (dow === 5) {
    add(rep, day, 16 * 60, 45, {
      type: "task",
      title: "Εβδομαδιαία αναφορά επισκέψεων",
    });
  } else if (chance(0.3)) {
    add(rep, day, Math.max(afternoon, 16 * 60), 30, {
      type: "task",
      title: pick(repTasks),
    });
  }
}

/** Two field days a week with a rep, the rest is accounts, one-to-ones and planning. */
function planManager(manager, day, dayIndex) {
  const reps = repsOf(manager.id);
  const book = reps.flatMap((rep) => customersOf(rep.id));
  const dow = weekday(day);
  let clock = 9 * 60;

  if (dow === 1) {
    add(manager, day, clock, 60, {
      type: "meeting",
      title: "Εβδομαδιαία συνάντηση ομάδας",
      notes: `Με ${reps.map(firstName).join(", ")}. Στόχοι εβδομάδας και εκκρεμότητες.`,
    });
    clock += 90;
    add(manager, day, clock, 45, {
      type: "meeting",
      title: "Συνάντηση με τον διευθυντή πωλήσεων",
      notes: "Πορεία στόχων περιοχής και forecast.",
    });
    clock = 14 * 60;
  }

  const fieldDays = manager.id === "m2" ? [2, 3] : [2, 4];
  if (fieldDays.includes(dow)) {
    const rep =
      reps[(Math.floor(dayIndex / 5) + fieldDays.indexOf(dow)) % reps.length];
    for (const customer of dayRoute(customersOf(rep.id), between(3, 4))) {
      const length = visitLength(customer);
      add(manager, day, clock, length, {
        type: "visit",
        title: `Visit: ${customer.name}`,
        customerId: customer.id,
        notes: `Συνοδεία στο πεδίο με ${rep.name}.`,
      });
      clock += length + gap(30, 60);
    }
    add(manager, day, Math.max(clock, 15 * 60), 30, {
      type: "meeting",
      title: `Coaching debrief: ${rep.name}`,
      notes: "Τι πήγε καλά, ένα σημείο βελτίωσης, επόμενο βήμα.",
    });
    return;
  }

  if (dow === 3 || dow === 5) {
    const rep = reps[(Math.floor(dayIndex / 5) + dow) % reps.length];
    add(manager, day, clock, 30, {
      type: "meeting",
      title: `1:1 με ${rep.name}`,
      notes: "Pipeline, κάλυψη πελατών, ανάγκες σε δείγματα.",
    });
    clock += 60;
  }

  const accounts = keyAccounts(book);
  if (chance(0.5)) {
    const customer = pick(
      accounts.filter((c) => c.type === "Hospital" || c.type === "Eopyy"),
    );
    add(manager, day, Math.max(clock, 11 * 60), 90, {
      type: "meeting",
      title: `Meeting: ${customer.name}`,
      customerId: customer.id,
      notes:
        customer.type === "Hospital"
          ? "Επιτροπή φαρμάκων. Φέρτε τα έγγραφα του διαγωνισμού."
          : "Ενημέρωση για τη λίστα αποζημίωσης.",
    });
    clock = Math.max(clock, 11 * 60) + 120;
  }

  let afternoon = Math.max(clock, 13 * 60);
  for (let i = between(2, 3); i > 0; i--) {
    const customer = pick(accounts);
    add(manager, day, afternoon, 20, {
      type: "call",
      title: `Call: ${customer.name}`,
      customerId: customer.id,
      notes: pick(callNotes),
    });
    afternoon += gap(30, 50);
  }

  add(manager, day, Math.max(afternoon, 16 * 60), 45, {
    type: "task",
    title: dow === 5 ? "Ανασκόπηση εβδομαδιαίων αναφορών" : pick(managerTasks),
  });
}

const directorTasks = [
  "Έλεγχος forecast και κάλυψης",
  "Έγκριση πλάνου κύκλου",
  "Ανασκόπηση CLM και follow-up",
  "Προετοιμασία διοικητικής αναφοράς",
];

/** Monday leadership meeting, midweek calls on key accounts, Friday close. */
function planDirector(director, day, dayIndex) {
  const managers = users.filter((user) => user.role === "manager");
  const book = users
    .filter((user) => user.role === "rep")
    .flatMap((rep) => customersOf(rep.id));
  const accounts = keyAccounts(book);
  const dow = weekday(day);
  let clock = 9 * 60;

  if (dow === 1) {
    add(director, day, clock, 75, {
      type: "meeting",
      title: "Σύσκεψη διευθυντών πωλήσεων",
      notes: `Με ${managers.map((manager) => manager.name).join(" και ")}. Στόχοι κύκλου και κάλυψη.`,
    });
    add(director, day, 11 * 60, 45, {
      type: "task",
      title: "Έλεγχος forecast και κάλυψης περιοχών",
    });
    return;
  }

  if (dow === 3) {
    const manager = managers[Math.floor(dayIndex / 5) % managers.length];
    add(director, day, clock, 45, {
      type: "meeting",
      title: `1:1 με ${manager.name}`,
      notes: "Ομάδα, κενά κάλυψης και εγκρίσεις εξόδων.",
    });
    clock += 75;
  }

  if (dow === 5) {
    add(director, day, clock, 60, {
      type: "meeting",
      title: "Ανασκόπηση εβδομάδας",
      notes: "Επισκέψεις, ακυρώσεις και follow-up ανά ομάδα.",
    });
    add(director, day, 15 * 60, 45, {
      type: "task",
      title: "Εβδομαδιαία αναφορά διοίκησης",
    });
    return;
  }

  if (accounts.length === 0) return;
  let afternoon = Math.max(clock, 11 * 60);
  for (let i = between(2, 4); i > 0; i--) {
    const customer = pick(accounts);
    add(director, day, afternoon, 25, {
      type: "call",
      title: `Call: ${customer.name}`,
      customerId: customer.id,
      notes: "Έλεγχος σχέσης με βασικό λογαριασμό.",
    });
    afternoon += gap(40, 70);
  }
  if (chance(0.45) && accounts.length) {
    const customer = pick(accounts);
    add(director, day, Math.max(afternoon, 15 * 60), 60, {
      type: "meeting",
      title: `Meeting: ${customer.name}`,
      customerId: customer.id,
      notes: "Συνάντηση με βασικό λογαριασμό, μαζί με τον διευθυντή περιοχής.",
    });
  }
  add(director, day, 16 * 60 + 30, 40, {
    type: "task",
    title: pick(directorTasks),
  });
}

const days = workdays();
days.forEach((day, dayIndex) => {
  for (const person of users) {
    if (busy.has(`${person.id}|${day}`)) continue;
    if (person.role === "rep") planRep(person, day);
    else if (person.role === "director") planDirector(person, day, dayIndex);
    else if (person.role === "manager") planManager(person, day, dayIndex);
  }
});

const byStart = (a, b) => a.start.localeCompare(b.start);
write("activities", [...baseActivities, ...activities.sort(byStart)]);
write("visits", [
  ...baseVisits,
  ...visits.sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt)),
]);

console.log(
  `${activities.length} activities and ${visits.length} check-ins generated for ${days.length} workdays`,
);
