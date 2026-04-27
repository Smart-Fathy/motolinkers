export interface Testimonial {
  initials: string;
  name: string;
  role: string;
  text: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    initials: "YD",
    name: "Yasser Dawood",
    role: "Branch Manager · E-Bank",
    text: "What impressed me most was the clarity. I knew exactly what I was paying for and why.",
  },
  {
    initials: "WZ",
    name: "Wael Zaky",
    role: "Finance Manager · E-Bank",
    text: "As someone working in finance, transparency is critical for me. The entire process was structured and documented, from factory pricing to freight and delivery. There were no hidden costs.",
  },
  {
    initials: "MS",
    name: "Maha Shafiq",
    role: "Operations Manager · OSOCO",
    text: "The car arrived exactly as promised and at a better value than what I was seeing locally. Overall, it felt trustworthy.",
  },
  {
    initials: "SM",
    name: "Seif Maged",
    role: "Logistics Manager · ArcelorMittal",
    text: "How satisfied I felt once I started driving the car. The whole experience — from choosing the car to receiving it — was simple, professional, and exactly what I was hoping for.",
  },
  {
    initials: "TR",
    name: "Tamer Refaat",
    role: "Head of Central Ops · E-Bank",
    text: "The team handled everything end-to-end — supplier verification, quality checks, shipping, delivery coordination. Stress-free.",
  },
];
