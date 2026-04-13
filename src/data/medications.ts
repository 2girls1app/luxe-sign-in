export interface MedicationEntry {
  name: string;
  category: string;
}

export const MEDICATION_CATEGORIES = [
  "Local Anesthetics",
  "Analgesics",
  "Sedatives",
  "Antiemetics",
  "Vasopressors",
  "Steroids",
  "Anticoagulants",
  "Muscle Relaxants",
  "Reversal Agents",
  "Other",
] as const;

export const MEDICATIONS_DATABASE: MedicationEntry[] = [
  // Local Anesthetics
  { name: "Lidocaine", category: "Local Anesthetics" },
  { name: "Bupivacaine", category: "Local Anesthetics" },
  { name: "Ropivacaine", category: "Local Anesthetics" },
  { name: "Mepivacaine", category: "Local Anesthetics" },
  { name: "Prilocaine", category: "Local Anesthetics" },
  { name: "Lidocaine with Epinephrine", category: "Local Anesthetics" },
  { name: "Bupivacaine with Epinephrine", category: "Local Anesthetics" },
  { name: "Marcaine", category: "Local Anesthetics" },
  { name: "Tetracaine", category: "Local Anesthetics" },


  // Analgesics
  { name: "Fentanyl", category: "Analgesics" },
  { name: "Morphine", category: "Analgesics" },
  { name: "Hydromorphone", category: "Analgesics" },
  { name: "Ketorolac", category: "Analgesics" },
  { name: "Acetaminophen IV", category: "Analgesics" },
  { name: "Remifentanil", category: "Analgesics" },
  { name: "Sufentanil", category: "Analgesics" },
  { name: "Meperidine", category: "Analgesics" },
  { name: "Tramadol", category: "Analgesics" },
  { name: "Ibuprofen", category: "Analgesics" },
  { name: "Celecoxib", category: "Analgesics" },

  // Sedatives
  { name: "Midazolam", category: "Sedatives" },
  { name: "Diazepam", category: "Sedatives" },
  { name: "Lorazepam", category: "Sedatives" },
  { name: "Dexmedetomidine", category: "Sedatives" },

  // Antiemetics
  { name: "Ondansetron", category: "Antiemetics" },
  { name: "Dexamethasone", category: "Antiemetics" },
  { name: "Metoclopramide", category: "Antiemetics" },
  { name: "Promethazine", category: "Antiemetics" },
  { name: "Scopolamine", category: "Antiemetics" },
  { name: "Aprepitant", category: "Antiemetics" },

  // Vasopressors
  { name: "Epinephrine", category: "Vasopressors" },
  { name: "Phenylephrine", category: "Vasopressors" },
  { name: "Norepinephrine", category: "Vasopressors" },
  { name: "Vasopressin", category: "Vasopressors" },
  { name: "Ephedrine", category: "Vasopressors" },
  { name: "Dopamine", category: "Vasopressors" },

  // Steroids
  { name: "Dexamethasone", category: "Steroids" },
  { name: "Hydrocortisone", category: "Steroids" },
  { name: "Methylprednisolone", category: "Steroids" },
  { name: "Triamcinolone", category: "Steroids" },

  // Anticoagulants
  { name: "Heparin", category: "Anticoagulants" },
  { name: "Enoxaparin", category: "Anticoagulants" },
  { name: "Protamine", category: "Anticoagulants" },
  { name: "Tranexamic Acid", category: "Anticoagulants" },

  // Muscle Relaxants
  { name: "Succinylcholine", category: "Muscle Relaxants" },
  { name: "Rocuronium", category: "Muscle Relaxants" },
  { name: "Cisatracurium", category: "Muscle Relaxants" },
  { name: "Vecuronium", category: "Muscle Relaxants" },
  { name: "Pancuronium", category: "Muscle Relaxants" },

  // Reversal Agents
  { name: "Sugammadex", category: "Reversal Agents" },
  { name: "Neostigmine", category: "Reversal Agents" },
  { name: "Flumazenil", category: "Reversal Agents" },
  { name: "Naloxone", category: "Reversal Agents" },
  { name: "Glycopyrrolate", category: "Reversal Agents" },
];
