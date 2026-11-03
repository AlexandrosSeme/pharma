import { readFileSync, writeFileSync } from 'node:fs'

const products = JSON.parse(readFileSync('mock/data/products.json', 'utf8'))

const innEl = {
  Paracetamol: 'Παρακεταμόλη',
  Ibuprofen: 'Ιβουπροφαίνη',
  Amoxicillin: 'Αμοξικιλλίνη',
  Omeprazole: 'Ομεπραζόλη',
  Atorvastatin: 'Ατορβαστατίνη',
  Metformin: 'Μετφορμίνη',
  Cetirizine: 'Κετιριζίνη',
  'Vitamin D3': 'Βιταμίνη D3',
  Salbutamol: 'Σαλβουταμόλη',
  Diclofenac: 'Δικλοφενάκη',
  Lisinopril: 'Λισινοπρίλη',
  Amlodipine: 'Αμλοδιπίνη',
  Losartan: 'Λοσαρτάνη',
  Bisoprolol: 'Βισοπρολόλη',
  Clopidogrel: 'Κλοπιδογρέλη',
  Rosuvastatin: 'Ροσουβαστατίνη',
  Simvastatin: 'Σιμβαστατίνη',
  Aspirin: 'Ακετυλοσαλικυλικό οξύ',
  Gliclazide: 'Γλικλαζίδη',
  Sitagliptin: 'Σιταγλιπτίνη',
  'Insulin Glargine': 'Ινσουλίνη γλαργίνη',
  Azithromycin: 'Αζιθρομυκίνη',
  Ciprofloxacin: 'Σιπροφλοξασίνη',
  Cefuroxime: 'Κεφουροξίμη',
  Clarithromycin: 'Κλαριθρομυκίνη',
  Doxycycline: 'Δοξυκυκλίνη',
  Pantoprazole: 'Παντοπραζόλη',
  Esomeprazole: 'Εσομεπραζόλη',
  Loperamide: 'Λοπεραμίδη',
  Domperidone: 'Δομπεριδόνη',
  Simethicone: 'Σιμεθικόνη',
  Loratadine: 'Λοραταδίνη',
  Fexofenadine: 'Φεξοφεναδίνη',
  Desloratadine: 'Δεσλοραταδίνη',
  Montelukast: 'Μοντελουκάστη',
  Budesonide: 'Βουδεσονίδη',
  Fluticasone: 'Φλουτικαζόνη',
  Ambroxol: 'Αμβροξόλη',
  Naproxen: 'Ναπροξένη',
  Ketoprofen: 'Κετοπροφαίνη',
  Tramadol: 'Τραμαδόλη',
  'Codeine/Paracetamol': 'Κωδεΐνη / παρακεταμόλη',
  Sertraline: 'Σερτραλίνη',
  Escitalopram: 'Εσιταλοπράμη',
  Alprazolam: 'Αλπραζολάμη',
  Levothyroxine: 'Λεβοθυροξίνη',
  'Vitamin C': 'Βιταμίνη C',
  Magnesium: 'Μαγνήσιο',
  'Omega-3': 'Ωμέγα-3',
  Zinc: 'Ψευδάργυρος',
}

const atc = {
  Paracetamol: 'N02BE01',
  Ibuprofen: 'M01AE01',
  Amoxicillin: 'J01CA04',
  Omeprazole: 'A02BC01',
  Atorvastatin: 'C10AA05',
  Metformin: 'A10BA02',
  Cetirizine: 'R06AE07',
  'Vitamin D3': 'A11CC05',
  Salbutamol: 'R03AC02',
  Diclofenac: 'M02AA15',
  Lisinopril: 'C09AA03',
  Amlodipine: 'C08CA01',
  Losartan: 'C09CA01',
  Bisoprolol: 'C07AB07',
  Clopidogrel: 'B01AC04',
  Rosuvastatin: 'C10AA07',
  Simvastatin: 'C10AA01',
  Aspirin: 'B01AC06',
  Gliclazide: 'A10BB09',
  Sitagliptin: 'A10BH01',
  'Insulin Glargine': 'A10AE04',
  Azithromycin: 'J01FA10',
  Ciprofloxacin: 'J01MA02',
  Cefuroxime: 'J01DC02',
  Clarithromycin: 'J01FA09',
  Doxycycline: 'J01AA02',
  Pantoprazole: 'A02BC02',
  Esomeprazole: 'A02BC05',
  Loperamide: 'A07DA03',
  Domperidone: 'A03FA03',
  Simethicone: 'A03AX13',
  Loratadine: 'R06AX13',
  Fexofenadine: 'R06AX26',
  Desloratadine: 'R06AX27',
  Montelukast: 'R03DC03',
  Budesonide: 'R03BA02',
  Fluticasone: 'R01AD08',
  Ambroxol: 'R05CB06',
  Naproxen: 'M01AE02',
  Ketoprofen: 'M02AA10',
  Tramadol: 'N02AX02',
  'Codeine/Paracetamol': 'N02AJ06',
  Sertraline: 'N06AB06',
  Escitalopram: 'N06AB10',
  Alprazolam: 'N05BA12',
  Levothyroxine: 'H03AA01',
  'Vitamin C': 'A11GA01',
  Magnesium: 'A12CC',
  'Omega-3': 'C10AX06',
  Zinc: 'A12CB01',
}

const atcPath = {
  N: { en: 'Nervous system', el: 'Νευρικό σύστημα' },
  M: { en: 'Musculoskeletal system', el: 'Μυοσκελετικό σύστημα' },
  J: { en: 'Anti-infectives', el: 'Αντιλοιμώδη' },
  A: { en: 'Alimentary tract and metabolism', el: 'Πεπτικό και μεταβολισμός' },
  C: { en: 'Cardiovascular system', el: 'Καρδιαγγειακό σύστημα' },
  R: { en: 'Respiratory system', el: 'Αναπνευστικό σύστημα' },
  B: { en: 'Blood and blood forming organs', el: 'Αίμα' },
  H: { en: 'Systemic hormonal preparations', el: 'Ορμόνες' },
}

function innOf(name) {
  return name.replace(/\s+\d[\d./]*\s*(?:mg|mcg|IU|%|g|U\/ml|U).*$/i, '').replace(/\s+Inhaler|\s+Nasal Spray|\s+Gel|\s+Syrup/gi, '').trim()
}

function amountOf(name) {
  const m = /(\d[\d./]*\s*(?:mg|mcg|IU|%|g|U\/ml|U)(?:\/\d+\s*mg)?)/i.exec(name)
  return m ? m[1].replace(/\s+/g, ' ') : ''
}

function months(n) {
  const out = []
  const now = new Date(Date.UTC(2026, 9, 1))
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function prices(base) {
  return months(18).map((month, i) => {
    const wave = 1 + Math.sin(i / 4) * 0.04 + (i - 9) * 0.002
    const pharmacy = Number((base * wave).toFixed(2))
    const wholesale = Number((pharmacy * 0.72).toFixed(2))
    const reimbursement = pharmacy > 8 ? Number((pharmacy * 0.55).toFixed(2)) : null
    return { month, wholesale, pharmacy, reimbursement }
  })
}

function loc(en, el) {
  return { en, el }
}

function copyFor(inn, category, form) {
  const summaries = {
    Analgesics: loc(
      `${inn} is used for mild to moderate pain and fever in adults. Confirm the current SmPC before any discussion.`,
      `Η ${inn} χρησιμοποιείται για ήπιο έως μέτριο πόνο και πυρετό σε ενηλίκους. Επιβεβαιώστε το ισχύον ΠΧΠ πριν από κάθε συζήτηση.`,
    ),
    'Anti-inflammatory': loc(
      `${inn} is an anti-inflammatory used for musculoskeletal pain. Duration and gastroprotection depend on the patient.`,
      `Η ${inn} είναι αντιφλεγμονώδες για μυοσκελετικό πόνο. Η διάρκεια και η γαστροπροστασία εξαρτώνται από τον ασθενή.`,
    ),
    Antibiotics: loc(
      `${inn} is an antibacterial. Complete the prescribed course and check local resistance patterns.`,
      `Η ${inn} είναι αντιβακτηριακό. Ολοκληρώστε την προβλεπόμενη αγωγή και ελέγξτε τα τοπικά δεδομένα αντοχής.`,
    ),
    Gastrointestinal: loc(
      `${inn} is used for acid-related or motility disorders of the digestive tract.`,
      `Η ${inn} χρησιμοποιείται σε διαταραχές οξύτητας ή κινητικότητας του πεπτικού.`,
    ),
    Cardiovascular: loc(
      `${inn} is used in cardiovascular prevention or treatment. Monitor blood pressure, lipids or bleeding risk as relevant.`,
      `Η ${inn} χρησιμοποιείται στην καρδιαγγειακή πρόληψη ή θεραπεία. Παρακολουθήστε πίεση, λιπίδια ή αιμορραγικό κίνδυνο.`,
    ),
    Diabetes: loc(
      `${inn} is an antidiabetic. Review hypoglycaemia risk, renal function and concomitant therapy.`,
      `Η ${inn} είναι αντιδιαβητικό. Ελέγξτε κίνδυνο υπογλυκαιμίας, νεφρική λειτουργία και συγχορήγηση.`,
    ),
    Antihistamines: loc(
      `${inn} is used for allergic rhinitis and urticaria. Sedation varies by molecule.`,
      `Η ${inn} χρησιμοποιείται σε αλλεργική ρινίτιδα και κνίδωση. Η καταστολή διαφέρει ανά μόριο.`,
    ),
    Supplements: loc(
      `${inn} is a nutritional supplement. It does not replace a prescribed treatment.`,
      `Η ${inn} είναι διατροφικό συμπλήρωμα. Δεν αντικαθιστά συνταγογραφούμενη αγωγή.`,
    ),
    Respiratory: loc(
      `${inn} is used in airway disease. Check inhaler technique where relevant.`,
      `Η ${inn} χρησιμοποιείται σε παθήσεις αεραγωγών. Ελέγξτε την τεχνική εισπνοής όπου εφαρμόζεται.`,
    ),
    CNS: loc(
      `${inn} acts on the central nervous system. Titrate slowly and review interactions.`,
      `Η ${inn} δρα στο κεντρικό νευρικό σύστημα. Τιτλοποιήστε αργά και ελέγξτε αλληλεπιδράσεις.`,
    ),
    Endocrine: loc(
      `${inn} is endocrine replacement or modulation. Dose is individual and lab-guided.`,
      `Η ${inn} είναι ενδοκρινική υποκατάσταση ή ρύθμιση. Η δόση είναι εξατομικευμένη και βάσει εργαστηρίου.`,
    ),
  }
  return summaries[category] ?? loc(`${inn} field monograph for visits.`, `Φάκελος πεδίου για ${inn}.`)
}

const medications = products.map((p, index) => {
  const inn = innOf(p.name)
  const amount = amountOf(p.name)
  const code = atc[inn] ?? 'Z99'
  const group = atcPath[code[0]] ?? loc('Various', 'Διάφορα')
  const summary = copyFor(inn, p.category, p.form)
  const rx = p.prescriptionRequired
  return {
    id: p.id,
    inn,
    innEl: innEl[inn] ?? inn,
    tradeName: p.name,
    atcCode: code,
    atcPath: group,
    eofChapter: `${String((index % 17) + 1).padStart(2, '0')}.0${(index % 5) + 1}`,
    maHolder: ['PharmaHold S.A.', 'Helios Pharma', 'Medica Hellas', 'Ionian Labs'][index % 4],
    maNumber: `MA-${String(12000 + index * 17)}`,
    summary,
    substances: [
      { name: inn, nameEl: innEl[inn] ?? inn, amount: amount || p.form, role: 'active' },
      { name: 'Microcrystalline cellulose', nameEl: 'Μικροκρυσταλλική κυτταρίνη', amount: 'q.s.', role: 'excipient' },
    ],
    administration: {
      route: loc(p.form, p.form),
      posology: loc(
        `Usual adult use as authorised for ${inn} ${amount}. Adjust in renal or hepatic impairment.`,
        `Συνήθης χρήση ενηλίκων όπως έχει εγκριθεί για ${inn} ${amount}. Προσαρμόστε σε νεφρική ή ηπατική ανεπάρκεια.`,
      ),
      duration: loc(
        'Follow the authorised duration. Do not extend a visit discussion beyond the SmPC.',
        'Ακολουθήστε την εγκεκριμένη διάρκεια. Μην επεκτείνετε τη συζήτηση επίσκεψης πέρα από το ΠΧΠ.',
      ),
    },
    availability: {
      prescription: rx,
      eopyy: rx && p.price > 6,
      hospital: ['Antibiotics', 'Diabetes', 'CNS'].includes(p.category),
      retail: true,
      note: loc(
        rx
          ? 'Prescription-only in Greece. Check current EOF and EOPYY lists before a reimbursement claim.'
          : 'Pharmacy supply without prescription. Confirm local classification before advice.',
        rx
          ? 'Συνταγογραφούμενο στην Ελλάδα. Ελέγξτε τους ισχύοντες καταλόγους ΕΟΦ και ΕΟΠΥΥ πριν από ισχυρισμό αποζημίωσης.'
          : 'Διάθεση από φαρμακείο χωρίς συνταγή. Επιβεβαιώστε την τοπική κατάταξη πριν από συμβουλή.',
      ),
    },
    precautions: {
      contraindications: [
        loc(`Known hypersensitivity to ${inn} or any excipient.`, `Γνωστή υπερευαισθησία στην ${inn} ή σε έκδοχο.`),
        loc('Do not use outside the authorised indications.', 'Μη χρήση εκτός εγκεκριμένων ενδείξεων.'),
      ],
      warnings: [
        loc('Review concomitant medicines and organ function before use.', 'Ελέγξτε συγχορηγούμενα φάρμακα και λειτουργία οργάνων πριν τη χρήση.'),
        loc('This screen is a field aid, not a complete SmPC.', 'Αυτή η οθόνη είναι βοήθημα πεδίου, όχι πλήρες ΠΧΠ.'),
      ],
      pregnancy: loc('Use in pregnancy only if clearly needed and authorised.', 'Στην κύηση μόνο αν είναι σαφώς αναγκαίο και εγκεκριμένο.'),
      lactation: loc('Check whether the substance is compatible with breastfeeding.', 'Ελέγξτε αν η ουσία είναι συμβατή με τον θηλασμό.'),
    },
    prices: prices(p.price),
  }
})

writeFileSync('mock/data/medications.json', `${JSON.stringify(medications, null, 2)}\n`)
console.log(`wrote ${medications.length} medications`)
