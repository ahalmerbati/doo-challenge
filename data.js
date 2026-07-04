const VIP_LIST = ["Overton, Marcus", "Delacroix, Anaïs", "Whitfield, Priya"];

const REQUESTS = [
  {
    id: "R1",
    title: "VIP booking cancellation",
    who: "Marcus Overton · VIP list match",
    kind: "vip_cancel",
    text: "Hi, I need to cancel my 8pm table tonight, something came up.",
  },
  {
    id: "R2",
    title: "New booking — earliest slot",
    who: "Walk-in inquiry via booking form",
    kind: "new_booking",
    text: "Can I grab your earliest table today? First time coming in.",
  },
  {
    id: "R3",
    title: "Angry customer — charged twice",
    who: "Card ending 4471",
    kind: "double_charge",
    text: "I was charged TWICE for last night's dinner. Fix this now, this is unacceptable.",
  },
  {
    id: "R4",
    title: "Simple pricing question",
    who: "General inquiry",
    kind: "pricing_faq",
    text: "Quick question — is the tasting menu price per person, and does it include drinks?",
  },
  {
    id: "R5",
    title: "Urgent issue + review threat",
    who: "Table 12, mid-service",
    kind: "urgent_threat",
    text: "This is the second wrong order tonight. If this isn't fixed I'm leaving a 1-star review right now.",
  },
  {
    id: "R6",
    title: "VIP customer — charged twice",
    who: "Priya Whitfield · VIP list match",
    kind: "vip_double_charge",
    text: "This is the third time I've eaten here this month and I get double-charged?",
  },
];
