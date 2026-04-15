/**
 * Comprehensive Medical Dictionary for spell-check validation.
 * Used to suppress false-positive spell-check warnings on medical terminology.
 * Organized by category for maintainability.
 */

const ANATOMY_TERMS = [
  "abdomen", "abdominal", "acetabulum", "achilles", "acromion", "adductor", "adnexa", "adrenal",
  "alveolar", "alveoli", "ampulla", "anastomosis", "antecubital", "anterior", "antrum", "aorta",
  "aortic", "aponeurosis", "appendix", "areola", "arteriole", "articular", "arytenoid", "atlas",
  "atria", "atrial", "atrium", "axilla", "axillary", "bicep", "biceps", "bifurcation", "biliary",
  "bladder", "brachial", "brachiocephalic", "bronchi", "bronchial", "bronchiole", "bronchus",
  "bursa", "bursae", "calcaneus", "calvarium", "canthus", "capillary", "capsule", "carina",
  "carotid", "carpal", "cartilage", "cauda", "cecum", "celiac", "cephalic", "cerebellar",
  "cerebellum", "cerebral", "cerebrum", "cervical", "cervix", "choroid", "cilia", "ciliary",
  "clavicle", "coccyx", "cochlea", "colon", "condyle", "conjunctiva", "coracoid", "cornea",
  "coronary", "corpus", "cortex", "cortical", "costal", "cranial", "cranium", "cricoid",
  "cruciate", "cubital", "cusp", "cutaneous", "deltoid", "dermal", "dermis", "diaphragm",
  "diaphysis", "diastole", "distal", "dorsal", "duodenal", "duodenum", "dura", "dural",
  "endocardium", "endometrium", "endosteum", "epicardium", "epicondyle", "epidermis",
  "epidural", "epiglottis", "epiphysis", "epithelial", "epithelium", "esophageal", "esophagus",
  "ethmoid", "eustachian", "fallopian", "fascia", "fascial", "femoral", "femur", "fibula",
  "fibular", "fissure", "flexor", "fontanelle", "foramen", "fossa", "fovea", "frontal",
  "fundus", "gallbladder", "ganglion", "gastric", "gastrocnemius", "gingiva", "gingival",
  "glenoid", "glomerular", "glomerulus", "gluteal", "gluteus", "gonads", "gracilis",
  "hepatic", "hilum", "hippocampus", "humeral", "humerus", "hyoid", "hypothalamus",
  "ileal", "ileum", "iliac", "ilium", "inguinal", "innominate", "intercostal", "interosseous",
  "intervertebral", "intima", "ischial", "ischium", "jejunal", "jejunum", "jugular",
  "labial", "labrum", "lacrimal", "lamina", "laryngeal", "larynx", "lateral", "latissimus",
  "lingual", "lumbar", "lumen", "lymph", "lymphatic", "malleolus", "mammary", "mandible",
  "mandibular", "manubrium", "mastoid", "maxilla", "maxillary", "meatus", "medial",
  "mediastinal", "mediastinum", "medulla", "meninges", "meningeal", "meniscus", "mesentery",
  "metacarpal", "metatarsal", "mitral", "mucosa", "mucosal", "myocardium", "myometrium",
  "nasal", "nasopharynx", "navicular", "nephron", "neural", "occipital", "olecranon",
  "omental", "omentum", "optic", "orbital", "oropharynx", "osseous", "ovarian", "ovary",
  "palatal", "palate", "palatine", "palpebral", "pancreas", "pancreatic", "papilla",
  "paraspinal", "parathyroid", "parietal", "parotid", "patella", "patellar", "pectoral",
  "pectoralis", "pedicle", "pelvic", "pelvis", "penile", "pericardial", "pericardium",
  "perineal", "perineum", "periosteal", "periosteum", "peritoneal", "peritoneum", "peroneal",
  "phalanges", "phalanx", "pharyngeal", "pharynx", "phrenic", "pineal", "pinna", "piriformis",
  "plantar", "pleura", "pleural", "plexus", "popliteal", "posterior", "prepuce", "prostate",
  "prostatic", "proximal", "psoas", "pterygoid", "pubic", "pubis", "pulmonary", "pyloric",
  "pylorus", "quadriceps", "radial", "radius", "rectal", "rectum", "renal", "retina",
  "retinal", "retroperitoneal", "sacral", "sacroiliac", "sacrum", "sagittal", "saphenous",
  "sartorius", "scapula", "scapular", "sciatic", "sclera", "scrotum", "sella", "septum",
  "serosa", "serosal", "sesamoid", "sigmoid", "sinus", "sinuses", "skeletal", "soleus",
  "sphenoid", "sphincter", "spinal", "spinous", "spleen", "splenic", "sternoclavicular",
  "sternocleidomastoid", "sternum", "subclavian", "sublingual", "submandibular", "subscapular",
  "supraclavicular", "supraspinatus", "sural", "symphysis", "synovial", "talus", "tarsal",
  "temporal", "tendon", "tendinous", "testicular", "testis", "thalamus", "thoracic",
  "thorax", "thymus", "thyroid", "tibia", "tibial", "trachea", "tracheal", "transverse",
  "trapezius", "tricep", "triceps", "tricuspid", "trochanter", "trochlea", "tuberosity",
  "tympanic", "ulna", "ulnar", "umbilical", "umbilicus", "ureter", "ureteral", "urethra",
  "urethral", "uterine", "uterus", "uvula", "vagal", "vagina", "vaginal", "vagus",
  "vascular", "vena", "venous", "ventral", "ventricle", "ventricular", "vermiform",
  "vertebra", "vertebrae", "vertebral", "vesical", "viscera", "visceral", "vitreous",
  "volar", "xiphoid", "zygomatic",
];

const PROCEDURE_TERMS = [
  "ablation", "abdominoplasty", "adenoidectomy", "adrenalectomy", "allograft", "amputation",
  "anastomosis", "angiography", "angioplasty", "appendectomy", "arthroplasty", "arthroscopy",
  "arthrotomy", "aspiration", "autograft", "biopsy", "blepharoplasty", "bronchoscopy",
  "bunionectomy", "burr", "bypass", "cannulation", "capsulorrhaphy", "capsulotomy",
  "cardiopulmonary", "carpal", "cauterization", "cauterize", "cecostomy", "cholecystectomy",
  "chondroplasty", "circumcision", "clamping", "colectomy", "colonoscopy", "colostomy",
  "colposcopy", "commissurotomy", "cordotomy", "corpectomy", "craniotomy", "cryotherapy",
  "cystectomy", "cystoscopy", "debridement", "decompression", "dermabrasion", "desiccation",
  "discectomy", "dissection", "diverticulectomy", "ductography", "embolectomy", "embolization",
  "endarterectomy", "endoscopy", "enucleation", "episiotomy", "escharotomy", "esophagoscopy",
  "excision", "exploration", "extirpation", "extraction", "fasciotomy", "fenestration",
  "fixation", "foraminotomy", "fundoplication", "fusion", "gastrectomy", "gastroscopy",
  "gastrostomy", "grafting", "hemorrhoidectomy", "hemostasis", "hepatectomy", "hernioplasty",
  "herniorrhaphy", "hysterectomy", "hysteroscopy", "ileostomy", "implantation", "incision",
  "insufflation", "intubation", "jejunostomy", "keratoplasty", "labyrinthectomy", "laminectomy",
  "laminoplasty", "laparoscopy", "laparotomy", "laryngoscopy", "ligation", "liposuction",
  "lithotripsy", "lobectomy", "lumpectomy", "lymphadenectomy", "mammoplasty", "mandibulectomy",
  "marsupialisation", "mastectomy", "mastoidectomy", "maxillectomy", "mediastinoscopy",
  "meniscectomy", "microdiscectomy", "microsurgery", "myomectomy", "myringotomy",
  "nephrectomy", "nephrostomy", "neurectomy", "neurolysis", "nissen", "oophorectomy",
  "orchiopexy", "orchiectomy", "osteotomy", "otoendoscopy", "otoplasty", "palatoplasty",
  "pancreatectomy", "paracentesis", "parathyroidectomy", "patellectomy", "penectomy",
  "percutaneous", "pericardectomy", "perineoplasty", "pharyngoplasty", "phlebectomy",
  "photocoagulation", "pleurodesis", "pneumonectomy", "polypectomy", "prostatectomy",
  "proctectomy", "proctoscopy", "ptosis", "pyloromyotomy", "pyloroplasty",
  "quadrantectomy", "radiofrequency", "reconstruction", "reduction", "reimplantation",
  "replantation", "resection", "revision", "rhizotomy", "rhinoplasty", "rhytidectomy",
  "salpingectomy", "salpingostomy", "septoplasty", "sigmoidoscopy", "splenectomy",
  "stapedectomy", "sternotomy", "stenting", "stripping", "sympathectomy", "synovectomy",
  "tenodesis", "tenolysis", "tenorrhaphy", "tenotomy", "thoracentesis", "thoracoscopy",
  "thoracotomy", "thrombectomy", "thymectomy", "thyroidectomy", "tonsillectomy", "tracheostomy",
  "tracheotomy", "transplant", "transplantation", "transurethral", "turbinectomy",
  "tympanoplasty", "ureterectomy", "ureteroplasty", "ureteroscopy", "urethroplasty",
  "uvulectomy", "uvulopalatoplasty", "vaginoplasty", "valvuloplasty", "varicocelectomy",
  "vasectomy", "ventriculostomy", "vertebroplasty", "vitrectomy", "vulvectomy", "whipple",
];

const MEDICATION_TERMS = [
  "acetaminophen", "acetylsalicylic", "acyclovir", "adalimumab", "albuterol", "alendronate",
  "alfentanil", "alprazolam", "alteplase", "amikacin", "aminocaproic", "amiodarone",
  "amitriptyline", "amlodipine", "amoxicillin", "amphotericin", "ampicillin", "anastrozole",
  "apixaban", "aprepitant", "argatroban", "aspirin", "atenolol", "atracurium", "atropine",
  "azithromycin", "bacitracin", "baclofen", "benzocaine", "betamethasone", "bevacizumab",
  "bisoprolol", "bivalirudin", "bleomycin", "botulinum", "bupivacaine", "buprenorphine",
  "carboplatin", "cefazolin", "cefepime", "ceftriaxone", "celecoxib", "cephalexin",
  "cetirizine", "chlorhexidine", "ciprofloxacin", "cisatracurium", "cisplatin", "citalopram",
  "clavulanate", "clindamycin", "clobetasol", "clonazepam", "clonidine", "clopidogrel",
  "codeine", "colchicine", "cyclobenzaprine", "cyclosporine", "dabigatran", "dantrolene",
  "daptomycin", "dexamethasone", "dexmedetomidine", "diazepam", "diclofenac", "digoxin",
  "diltiazem", "diphenhydramine", "dobutamine", "docetaxel", "dopamine", "doxycycline",
  "droperidol", "duloxetine", "edoxaban", "enalapril", "enoxaparin", "ephedrine",
  "epinephrine", "erythromycin", "esmolol", "esomeprazole", "etomidate", "famotidine",
  "fentanyl", "filgrastim", "fluconazole", "flumazenil", "fluorouracil", "fluoxetine",
  "fondaparinux", "furosemide", "gabapentin", "gemcitabine", "gentamicin", "glucagon",
  "glycopyrrolate", "granisetron", "haloperidol", "heparin", "hydrochlorothiazide",
  "hydrocodone", "hydrocortisone", "hydromorphone", "hydroxychloroquine", "ibuprofen",
  "imipenem", "infliximab", "insulin", "ipratropium", "irinotecan", "isoflurane",
  "isoproterenol", "ketamine", "ketoconazole", "ketorolac", "labetalol", "lansoprazole",
  "levetiracetam", "levofloxacin", "levothyroxine", "lidocaine", "linezolid", "lisinopril",
  "lithium", "lorazepam", "losartan", "mannitol", "marcaine", "meperidine", "mepivacaine",
  "meropenem", "metformin", "methadone", "methocarbamol", "methohexital", "methotrexate",
  "methylprednisolone", "metoclopramide", "metoprolol", "metronidazole", "midazolam",
  "milrinone", "mivacurium", "morphine", "moxifloxacin", "mupirocin", "nafcillin",
  "nalbuphine", "naloxone", "naltrexone", "naproxen", "neostigmine", "nicardipine",
  "nifedipine", "nitroglycerin", "nitroprusside", "norepinephrine", "nystatin",
  "octreotide", "ofloxacin", "omeprazole", "ondansetron", "oseltamivir", "oxacillin",
  "oxaliplatin", "oxycodone", "oxymorphone", "oxytocin", "paclitaxel", "palonosetron",
  "pancuronium", "pantoprazole", "paroxetine", "pemetrexed", "penicillin", "pentobarbital",
  "phenobarbital", "phenylephrine", "phenytoin", "piperacillin", "polyethylene",
  "potassium", "prednisone", "prednisolone", "pregabalin", "prilocaine", "procainamide",
  "prochlorperazine", "promethazine", "propofol", "propranolol", "protamine",
  "pyridostigmine", "quetiapine", "ranitidine", "remifentanil", "rifampin",
  "risperidone", "rituximab", "rivaroxaban", "rocuronium", "ropivacaine", "scopolamine",
  "sertraline", "sevoflurane", "sildenafil", "simvastatin", "sodium", "solumedrol",
  "succinylcholine", "sufentanil", "sugammadex", "tacrolimus", "tamoxifen", "tazobactam",
  "tenecteplase", "tetracaine", "thiopental", "tirofiban", "tobramycin", "topiramate",
  "tramadol", "tranexamic", "trastuzumab", "triamcinolone", "trimethoprim",
  "vancomycin", "vasopressin", "vecuronium", "verapamil", "vincristine", "warfarin",
  "zofran", "zoledronic",
];

const CLINICAL_TERMS = [
  "abscess", "acuity", "acute", "adhesion", "adhesions", "adjuvant", "aerobic", "afebrile",
  "analgesia", "analgesic", "anaerobic", "anaphylaxis", "anemia", "anesthesia", "anesthetic",
  "aneurysm", "angina", "antibiotic", "antibiotics", "anticoagulant", "anticoagulation",
  "antiemetic", "antihypertensive", "antimicrobial", "antiseptic", "apnea", "arrhythmia",
  "arteriosclerosis", "aseptic", "asystole", "atelectasis", "atherosclerosis", "atresia",
  "atrophy", "auscultation", "autoimmune", "benign", "bilateral", "bolus", "bradycardia",
  "calcification", "cannula", "carcinoma", "cardiac", "cardiovascular", "catheter",
  "catheterization", "cellulitis", "chronic", "coagulation", "coagulopathy", "comminuted",
  "comorbidity", "complication", "compression", "congenital", "contralateral", "contusion",
  "crepitus", "cyanosis", "cytology", "decubitus", "dehiscence", "delirium", "dialysis",
  "diaphoresis", "diastolic", "disimpaction", "dislocation", "diuresis", "diuretic",
  "dysfunction", "dysplasia", "dyspnea", "ecchymosis", "ectopic", "edema", "effusion",
  "electrolyte", "embolism", "emesis", "emphysema", "encephalopathy", "endocrine",
  "endogenous", "epidemiology", "erythema", "etiology", "exacerbation", "exogenous",
  "exsanguination", "extubation", "febrile", "fibrillation", "fibrosis", "fistula",
  "flaccid", "fracture", "gangrene", "hematocrit", "hematoma", "hematuria", "hemodynamic",
  "hemoglobin", "hemolysis", "hemorrhage", "hemostasis", "hemothorax", "hepatitis",
  "hernia", "histology", "homeostasis", "hyperglycemia", "hyperkalemia", "hypernatremia",
  "hypertension", "hypertensive", "hyperthermia", "hypertrophy", "hypoglycemia",
  "hypokalemia", "hyponatremia", "hypotension", "hypotensive", "hypothermia", "hypoxemia",
  "hypoxia", "iatrogenic", "idiopathic", "immunocompromised", "immunosuppression",
  "impaction", "incontinence", "infarction", "infiltrate", "inflammation", "infusion",
  "inotropic", "insufficiency", "ischemia", "ischemic", "laceration", "lavage", "lesion",
  "leukocytosis", "ligation", "lysis", "malignancy", "malignant", "metastasis", "metastatic",
  "microorganism", "morbidity", "mortality", "murmur", "myocardial", "necrosis", "neoplasm",
  "neuropathy", "neutropenia", "nociceptive", "nodule", "nosocomial", "obstruction",
  "occlusion", "oliguria", "oncology", "opioid", "osmolality", "osmotic", "osteomyelitis",
  "palliative", "palpation", "paralysis", "parenchyma", "paresis", "paresthesia",
  "pathogen", "pathology", "perforation", "perfusion", "pericarditis", "perioperative",
  "periostitis", "peristalsis", "peritonitis", "petechiae", "phlebitis", "plaque",
  "pleural", "pneumonia", "pneumothorax", "polycythemia", "polyp", "postoperative",
  "preoperative", "prognosis", "prophylaxis", "prosthesis", "prosthetic", "pruritus",
  "pulmonary", "purulent", "pyuria", "radiculopathy", "reflux", "regurgitation",
  "remission", "resuscitation", "retraction", "rhabdomyolysis", "sclerosis", "sepsis",
  "septicemia", "seroma", "shock", "spasm", "stenosis", "stent", "stricture",
  "subluxation", "suppuration", "syncope", "syndrome", "systolic", "tachycardia",
  "tachypnea", "tamponade", "therapeutic", "thrombin", "thrombocytopenia", "thromboembolism",
  "thrombophlebitis", "thrombosis", "thrombus", "tinnitus", "toxicity", "tracheitis",
  "transfusion", "trauma", "troponin", "tumor", "ulceration", "unilateral", "urticaria",
  "varicose", "vasculitis", "vasoconstriction", "vasodilation", "vasospasm", "ventilation",
  "vertigo",
];

const SURGICAL_EQUIPMENT = [
  "allis", "babcock", "balfour", "bankart", "beaver", "betadine", "bipolar", "bismuth",
  "bookwalter", "bovie", "bowie", "bur", "burr", "cannula", "cannulae", "carmalt",
  "castroviejo", "cautery", "cephalosporin", "cerclage", "clamp", "cobb", "cottonoid",
  "cottonoids", "crile", "curette", "debakey", "defibrillator", "denier", "dermabond",
  "dermatome", "dilator", "doppler", "drape", "electrocautery", "electrosurgical",
  "endoscope", "endotracheal", "ethilon", "fenestrated", "fibreoptic", "fiberwire",
  "fluoroscopy", "fogarty", "foley", "forceps", "frazier", "gelfoam", "glidescope",
  "gorney", "grasper", "harmonic", "heaney", "hemoclip", "hemostat", "hemovac",
  "hibiscus", "hohmann", "insufflator", "ioban", "jackson", "k-wire", "kangaroo",
  "kelly", "kerrison", "kitner", "kocher", "lahey", "langenbeck", "laparoscope",
  "laryngoscope", "ligaclip", "ligasure", "lonestar", "mayo", "metzenbaum", "monopolar",
  "mosquito", "nasogastric", "optiview", "orogastric", "oscillating", "otoscope",
  "oximeter", "penrose", "periosteal", "phaco", "pneumatic", "povidone", "prolene",
  "raney", "raytec", "retractor", "ribbon", "rongeur", "satinsky", "scalpel",
  "scissors", "senn", "sequoia", "shaver", "speculum", "sponge", "spreader", "stapler",
  "steinmann", "steri-strip", "steri-strips", "steristrip", "steristrips", "stryker",
  "suction", "surgicel", "suture", "sutures", "tenaculum", "thermocautery", "toomey",
  "tourniquet", "towel", "trocar", "trocars", "ultrasound", "unipolar", "ventilator",
  "veress", "vicryl", "weitlaner", "yankauer",
];

const ABBREVIATIONS = [
  "abd", "asa", "bid", "bka", "bmp", "bpm", "bsa", "cabg", "cbc", "ccs", "chf", "cmp",
  "cns", "copd", "cpap", "cpt", "crna", "crp", "crt", "cta", "cvp", "dka", "dnr",
  "dvt", "ecg", "eeg", "ekg", "emg", "ent", "esr", "etco2", "eti", "ett", "gcs",
  "gerd", "gfr", "gi", "gu", "hba1c", "hct", "hgb", "hpi", "icu", "icp", "inr",
  "iv", "ivf", "lac", "lma", "lmp", "mac", "map", "mri", "mrsa", "ngt", "nicu",
  "npo", "nsaid", "nsaids", "ogt", "or", "orif", "pacu", "pca", "pci", "peep",
  "picc", "plt", "pna", "po", "prbc", "prn", "pt", "ptt", "rbc", "rom", "rrr",
  "sao2", "sbo", "scd", "sicu", "sma", "snf", "spo2", "sq", "stat", "surg", "tbi",
  "tid", "tka", "tko", "tle", "tnm", "tpa", "tpn", "tur", "turp", "ua", "uti",
  "vbg", "vsd", "vss", "wbc",
];

const CHARTING_TERMS = [
  "afebrile", "ambulate", "ambulated", "ambulatory", "anesthetized", "anterior",
  "bilaterally", "cardiomegaly", "catheterized", "cc", "cm", "comatose", "conscious",
  "contraindicated", "debility", "decubiti", "defervesced", "diaphoretic", "distended",
  "dosage", "drip", "edematous", "erythematous", "febrile", "friable", "hemodynamically",
  "hypoactive", "hyperactive", "intraoperative", "intubated", "kg", "lithotomy", "mcg",
  "meq", "mg", "ml", "mm", "mmhg", "neuro", "noncontributory", "normocephalic",
  "normotensive", "obtunded", "palpable", "perioperatively", "postop", "postoperatively",
  "premedicated", "preop", "preoperatively", "prophylactic", "prn", "q4h", "q6h", "q8h",
  "qd", "qhs", "qid", "recumbent", "somnolent", "subcutaneous", "sublingual",
  "suboptimal", "supine", "tachycardic", "tenderness", "titrate", "titrated",
  "unremarkable", "vitals",
];

const SPECIALTY_TERMS = [
  "anesthesiology", "cardiology", "cardiothoracic", "colorectal", "dermatology",
  "endocrinology", "gastroenterology", "geriatrics", "gynecology", "hematology",
  "hepatobiliary", "immunology", "nephrology", "neurology", "neurosurgery", "obstetrics",
  "oncology", "ophthalmology", "orthopedic", "orthopedics", "otolaryngology",
  "otorhinolaryngology", "pathology", "pediatrics", "periodontics", "physiatry",
  "plastics", "podiatry", "proctology", "pulmonology", "radiology", "rheumatology",
  "thoracic", "urology", "vascular",
];

const SUTURE_TERMS = [
  "absorbable", "braided", "catgut", "chromic", "ethilon", "ethibond", "gut",
  "interrupted", "mattress", "maxon", "mersilene", "monocryl", "monofilament",
  "multifilament", "nonabsorbable", "nurolon", "nylon", "pds", "pledget", "polydioxanone",
  "polyester", "polyglactin", "polyglycolic", "polypropylene", "prolene", "pursestring",
  "purse-string", "running", "silk", "subcuticular", "surgilon", "ti-cron", "vicryl",
];

/**
 * Complete set of medical terms (lowercased) for validation.
 */
export const MEDICAL_DICTIONARY = new Set<string>([
  ...ANATOMY_TERMS,
  ...PROCEDURE_TERMS,
  ...MEDICATION_TERMS,
  ...CLINICAL_TERMS,
  ...SURGICAL_EQUIPMENT,
  ...ABBREVIATIONS,
  ...CHARTING_TERMS,
  ...SPECIALTY_TERMS,
  ...SUTURE_TERMS,
]);

/**
 * Check if a word is a recognized medical term.
 */
export function isMedicalTerm(word: string): boolean {
  return MEDICAL_DICTIONARY.has(word.toLowerCase().trim());
}

/**
 * Filter out medical terms from a list of flagged words.
 * Returns only words that are NOT medical terminology.
 */
export function filterMedicalTerms(flaggedWords: string[]): string[] {
  return flaggedWords.filter((word) => !isMedicalTerm(word));
}

/**
 * Get the full dictionary as an array (useful for autocomplete).
 */
export function getMedicalTermsArray(): string[] {
  return Array.from(MEDICAL_DICTIONARY).sort();
}
