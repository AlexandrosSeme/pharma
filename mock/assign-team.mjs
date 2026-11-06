import { readFileSync, writeFileSync } from "node:fs";

const read = (name) =>
  JSON.parse(readFileSync(`mock/data/${name}.json`, "utf8"));
const write = (name, data) =>
  writeFileSync(`mock/data/${name}.json`, `${JSON.stringify(data, null, 2)}\n`);

const users = [
  {
    id: "d1",
    name: "Eleni Vasilaki",
    email: "eleni.vasilaki@pharmasales.gr",
    role: "director",
    territory: { en: "Greece", el: "Ελλάδα" },
  },
  {
    id: "1",
    name: "Giannis Papadopoulos",
    email: "giannis.papadopoulos@pharmasales.gr",
    role: "manager",
    managerId: "d1",
    territory: { en: "Attica", el: "Αττική" },
  },
  {
    id: "m2",
    name: "Kostas Ioannou",
    email: "kostas.ioannou@pharmasales.gr",
    role: "manager",
    managerId: "d1",
    territory: { en: "Outside Attica", el: "Εκτός Αττικής" },
  },
  {
    id: "r1",
    name: "Nikos Konstantinou",
    email: "nikos.konstantinou@pharmasales.gr",
    role: "rep",
    managerId: "1",
    territory: { en: "Athens center", el: "Κέντρο Αθήνας" },
  },
  {
    id: "r5",
    name: "Christina Nikolaou",
    email: "christina.nikolaou@pharmasales.gr",
    role: "rep",
    managerId: "1",
    territory: { en: "North Athens", el: "Βόρεια Αθήνα" },
  },
  {
    id: "r7",
    name: "Maria Alexiou",
    email: "maria.alexiou@pharmasales.gr",
    role: "rep",
    managerId: "1",
    territory: { en: "South Athens", el: "Νότια Αθήνα" },
  },
  {
    id: "r6",
    name: "Andreas Petroulias",
    email: "andreas.petroulias@pharmasales.gr",
    role: "rep",
    managerId: "1",
    territory: { en: "Piraeus and west Athens", el: "Πειραιάς και δυτικά" },
  },
  {
    id: "r2",
    name: "Anna Dimou",
    email: "anna.dimou@pharmasales.gr",
    role: "rep",
    managerId: "m2",
    territory: {
      en: "Thessaloniki, Serres, Kavala",
      el: "Θεσσαλονίκη, Σέρρες, Καβάλα",
    },
  },
  {
    id: "r4",
    name: "Petros Lazaridis",
    email: "petros.lazaridis@pharmasales.gr",
    role: "rep",
    managerId: "m2",
    territory: { en: "Thessaly and Epirus", el: "Θεσσαλία και Ήπειρος" },
  },
  {
    id: "r3",
    name: "Sofia Georgiou",
    email: "sofia.georgiou@pharmasales.gr",
    role: "rep",
    managerId: "m2",
    territory: { en: "Peloponnese", el: "Πελοπόννησος" },
  },
  {
    id: "r8",
    name: "Dimitris Markakis",
    email: "dimitris.markakis@pharmasales.gr",
    role: "rep",
    managerId: "m2",
    territory: { en: "Crete and the islands", el: "Κρήτη και νησιά" },
  },
];

const bricks = [
  {
    id: "ath-center",
    en: "Athens Center",
    el: "Κέντρο Αθήνας",
    managerId: "1",
    repId: "r1",
    cities: ["Athens"],
  },
  {
    id: "ath-north",
    en: "North Athens",
    el: "Βόρεια Αθήνα",
    managerId: "1",
    repId: "r5",
    cities: ["Marousi", "Kifisia", "Chalandri"],
  },
  {
    id: "ath-south",
    en: "South Athens",
    el: "Νότια Αθήνα",
    managerId: "1",
    repId: "r7",
    cities: ["Glyfada", "Alimos", "Nea Smyrni"],
  },
  {
    id: "ath-west",
    en: "West Athens",
    el: "Δυτική Αθήνα",
    managerId: "1",
    repId: "r6",
    cities: ["Peristeri", "Aigaleo", "Ilion"],
  },
  {
    id: "piraeus",
    en: "Piraeus",
    el: "Πειραιάς",
    managerId: "1",
    repId: "r6",
    cities: ["Piraeus"],
  },
  {
    id: "macedonia",
    en: "Thessaloniki, Serres, Kavala",
    el: "Θεσσαλονίκη, Σέρρες, Καβάλα",
    managerId: "m2",
    repId: "r2",
    cities: ["Thessaloniki", "Serres", "Kavala"],
  },
  {
    id: "thessaly",
    en: "Thessaly and Epirus",
    el: "Θεσσαλία και Ήπειρος",
    managerId: "m2",
    repId: "r4",
    cities: ["Larissa", "Volos", "Ioannina"],
  },
  {
    id: "peloponnese",
    en: "Peloponnese",
    el: "Πελοπόννησος",
    managerId: "m2",
    repId: "r3",
    cities: ["Patras", "Kalamata"],
  },
  {
    id: "islands",
    en: "Crete and the islands",
    el: "Κρήτη και νησιά",
    managerId: "m2",
    repId: "r8",
    cities: ["Heraklion", "Chania", "Rhodes", "Corfu"],
  },
];

const customers = read("customers");
const cityOwner = new Map(
  bricks.flatMap((brick) => brick.cities.map((city) => [city, brick.repId])),
);
for (const customer of customers) {
  const repId = cityOwner.get(customer.city);
  if (!repId) throw new Error(`No rep for ${customer.city}`);
  customer.repId = repId;
}

const territories = bricks.map((brick) => ({
  id: brick.id,
  name: { en: brick.en, el: brick.el },
  managerId: brick.managerId,
  repId: brick.repId,
  cities: brick.cities,
  accountIds: customers
    .filter((customer) => brick.cities.includes(customer.city))
    .map((customer) => customer.id),
}));

write("users", users);
write("customers", customers);
write("territories", territories);

const counts = Object.fromEntries(
  users
    .filter((user) => user.role === "rep")
    .map((rep) => [
      rep.name,
      customers.filter((customer) => customer.repId === rep.id).length,
    ]),
);
console.log(counts);
