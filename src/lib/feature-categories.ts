// Map a free-text feature label (e.g. a row label from a spec sheet) onto
// one of a small fixed set of section headers, by keyword match. Used by
// the spreadsheet import to bucket detected feature rows into the same
// `Record<string, string[]>` shape the admin form edits.

const RULES: { keywords: string[]; section: string }[] = [
  {
    section: "Driver assistance",
    keywords: [
      "lane",
      "cruise",
      "adaptive",
      "parking",
      "lidar",
      "autopilot",
      "autonomous",
      "ads",
      "assist",
      "summon",
      "blind spot",
    ],
  },
  {
    section: "Doors & access",
    keywords: [
      "door",
      "trunk",
      "tailgate",
      "handle",
      "suction",
      "frameless",
      "key",
      "keyless",
      "entry",
      "lock",
    ],
  },
  {
    section: "Seats & comfort",
    keywords: [
      "seat",
      "heated",
      "ventilated",
      "massage",
      "lumbar",
      "memory seat",
      "recline",
      "armrest",
    ],
  },
  {
    section: "Climate",
    keywords: [
      "air conditioning",
      "ac",
      "climate",
      "ventilation",
      "preheat",
      "preheating",
      "defrost",
    ],
  },
  {
    section: "Powertrain & charging",
    keywords: [
      "range",
      "battery",
      "charging",
      "charge",
      "motor",
      "kwh",
      "fast charging",
      "v2l",
      "v2g",
      "torque",
      "power",
    ],
  },
  {
    section: "Infotainment",
    keywords: [
      "display",
      "screen",
      "hud",
      "head-up",
      "sound",
      "speaker",
      "audio",
      "navigation",
      "carplay",
      "android auto",
      "wireless charging pad",
      "voice",
    ],
  },
  {
    section: "Safety",
    keywords: [
      "airbag",
      "abs",
      "esp",
      "esc",
      "crash",
      "collision",
      "safety",
      "seatbelt",
      "isofix",
      "tpms",
    ],
  },
  {
    section: "Lighting",
    keywords: [
      "headlight",
      "matrix",
      "led",
      "drl",
      "fog light",
      "ambient light",
    ],
  },
  {
    section: "Wheels & suspension",
    keywords: [
      "wheel",
      "rim",
      "tire",
      "tyre",
      "suspension",
      "air suspension",
      "damper",
    ],
  },
  {
    section: "Exterior",
    keywords: [
      "mirror",
      "wiper",
      "appearance",
      "paint",
      "roof",
      "spoiler",
      "panoramic",
      "sunroof",
    ],
  },
];

const FALLBACK_SECTION = "Other";

export function categoriseFeature(label: string): string {
  const lower = label.toLowerCase();
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.section;
    }
  }
  return FALLBACK_SECTION;
}
