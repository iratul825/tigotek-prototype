export type Section =
  | "Overview"
  | "Live Office"
  | "Progress"
  | "Staging"
  | "Tasks"
  | "Feedback"
  | "Approvals"
  | "Assets"
  | "Meetings"
  | "Activity"
  | "Team"
  | "Settings";
export type TaskStatus =
  "In progress" | "In review" | "Complete" | "Upcoming" | "Blocked";
export type Task = {
  id: string;
  title: string;
  department: string;
  floor: 1 | 2 | 3;
  assignee: string;
  initials: string;
  status: TaskStatus;
  priority: "High" | "Medium" | "Low";
  progress: number;
  due: string;
  dependency?: string;
  approval?: string;
  checklist: { title: string; done: boolean }[];
  current: string;
  updated: string;
};
export type Approval = {
  id: string;
  title: string;
  kind: string;
  owner: string;
  status: "Awaiting approval" | "Approved" | "Changes requested";
  description: string;
  version: string;
  note?: string;
};
export type Feedback = {
  id: string;
  target: string;
  x: number;
  y: number;
  text: string;
  status: "Pending" | "Resolved";
  created: string;
  replies: { text: string; author: string }[];
};
export type Activity = {
  id: string;
  person: string;
  initials: string;
  action: string;
  time: string;
  type: "design" | "code" | "approval" | "asset" | "feedback";
};
export type Asset = {
  id: string;
  name: string;
  category: "Brand" | "Content" | "Marketing";
  status: string;
  size: string;
  type: string;
  uploaded: string;
  key?: string;
};
export type Decision = {
  id: string;
  title: string;
  date: string;
  type: "Decision" | "Meeting" | "Client request" | "Scope change";
  body: string;
  status: string;
};
export type ProjectState = {
  tasks: Task[];
  approvals: Approval[];
  feedback: Feedback[];
  activity: Activity[];
  assets: Asset[];
  decisions: Decision[];
  settings: {
    name: string;
    notifications: boolean;
    motion: boolean;
    stagingUrl: string;
  };
  revision: number;
};
const task = (
  id: string,
  title: string,
  department: string,
  floor: 1 | 2 | 3,
  assignee: string,
  progress: number,
  status: TaskStatus,
  due: string,
  extra: Partial<Task> = {},
): Task => ({
  id,
  title,
  department,
  floor,
  assignee,
  initials: assignee
    .split(" ")
    .map((x) => x[0])
    .join(""),
  progress,
  status,
  due,
  priority: "Medium",
  checklist: [
    { title: "Requirements confirmed", done: true },
    { title: "Implementation", done: progress === 100 },
    { title: "Review and handoff", done: progress === 100 },
  ],
  current:
    progress === 100 ? "Delivered and approved" : "Implementation in progress",
  updated: "October 4, 2026",
  ...extra,
});
export const initialState: ProjectState = {
  revision: 0,
  settings: {
    name: "FABRIPASS",
    notifications: true,
    motion: true,
    stagingUrl: "/preview.html",
  },
  tasks: [
    task(
      "strategy",
      "Product strategy",
      "Strategy",
      3,
      "Nadia Rahman",
      100,
      "Complete",
      "2026-09-24",
    ),
    task(
      "research",
      "Competitor research",
      "Research",
      3,
      "Nadia Rahman",
      100,
      "Complete",
      "2026-09-25",
    ),
    task(
      "brand",
      "Brand system",
      "Branding",
      3,
      "Sarah Ahmed",
      100,
      "Complete",
      "2026-09-28",
    ),
    task(
      "copy",
      "Homepage copy",
      "Copywriting",
      3,
      "Ayesha Khan",
      66,
      "In review",
      "2026-10-06",
      {
        approval: "copy",
        priority: "High",
        current: "Waiting for your copy feedback",
      },
    ),
    task(
      "ui",
      "Homepage UI",
      "UI / UX",
      3,
      "Sarah Ahmed",
      82,
      "In review",
      "2026-10-07",
      {
        approval: "design",
        priority: "High",
        current: "Mobile wireframe review",
      },
    ),
    task(
      "creative",
      "Campaign art direction",
      "Creative Design",
      3,
      "Sarah Ahmed",
      78,
      "In progress",
      "2026-10-08",
    ),
    task(
      "frontend",
      "Homepage development",
      "Frontend",
      2,
      "Rifat Hossain",
      76,
      "In progress",
      "2026-10-09",
      {
        priority: "High",
        current: "Product showcase",
        dependency: "ui",
        checklist: [
          { title: "Navigation", done: true },
          { title: "Hero section", done: true },
          { title: "Mobile navigation", done: true },
          { title: "Typography system", done: true },
          { title: "Product showcase", done: false },
          { title: "Animations", done: false },
          { title: "Accessibility review", done: false },
          { title: "Final QA", done: false },
        ],
        updated: "Mobile layout updated · 11:42 AM",
      },
    ),
    task(
      "backend",
      "Passport API integration",
      "Backend",
      2,
      "Tanvir Hasan",
      38,
      "In progress",
      "2026-10-12",
      { dependency: "cms", current: "Connecting product provenance endpoints" },
    ),
    task(
      "cms",
      "Product CMS setup",
      "CMS",
      2,
      "Tanvir Hasan",
      100,
      "Complete",
      "2026-10-03",
    ),
    task(
      "qa",
      "Responsive QA",
      "QA",
      2,
      "Ishrat Jahan",
      0,
      "Upcoming",
      "2026-10-16",
      { dependency: "frontend", current: "Starts after homepage development" },
    ),
    task(
      "performance",
      "Performance budget",
      "Performance",
      2,
      "Rifat Hossain",
      32,
      "In progress",
      "2026-10-18",
    ),
    task(
      "integrations",
      "ERP connector",
      "Integrations",
      2,
      "Tanvir Hasan",
      0,
      "Blocked",
      "2026-10-15",
      { dependency: "backend", current: "Waiting for API integration" },
    ),
    task(
      "seo",
      "On-page SEO",
      "SEO",
      1,
      "Mahin Islam",
      64,
      "In progress",
      "2026-10-20",
      { current: "14 of 22 pages optimized" },
    ),
    task(
      "ads",
      "Meta campaign creatives",
      "Paid Advertising",
      1,
      "Ayesha Khan",
      24,
      "In review",
      "2026-10-19",
      { approval: "meta", current: "Campaign creative review" },
    ),
    task(
      "social",
      "Social launch kit",
      "Social Media",
      1,
      "Ayesha Khan",
      18,
      "In progress",
      "2026-10-21",
    ),
    task(
      "analytics",
      "Analytics and conversion tracking",
      "Analytics",
      1,
      "Mahin Islam",
      70,
      "In progress",
      "2026-10-19",
      { current: "Event validation in staging" },
    ),
    task(
      "content",
      "Launch content",
      "Content",
      1,
      "Ayesha Khan",
      12,
      "In progress",
      "2026-10-22",
    ),
    task(
      "launch",
      "Launch readiness",
      "Launch",
      1,
      "Nadia Rahman",
      0,
      "Upcoming",
      "2026-10-26",
      {
        dependency: "qa",
        priority: "High",
        current: "Release readiness review on October 23",
      },
    ),
  ],
  approvals: [
    {
      id: "design",
      title: "Homepage design",
      kind: "UI / UX",
      owner: "Sarah Ahmed",
      status: "Awaiting approval",
      description:
        "A clearer product story, refined passport cards, and a responsive mobile experience.",
      version: "V3",
    },
    {
      id: "copy",
      title: "Homepage copy",
      kind: "Content",
      owner: "Ayesha Khan",
      status: "Awaiting approval",
      description:
        "Review the headline and the three value propositions before development handoff.",
      version: "V2",
    },
    {
      id: "meta",
      title: "Meta ad creative",
      kind: "Marketing",
      owner: "Ayesha Khan",
      status: "Awaiting approval",
      description:
        "Launch campaign concept: every product has a story worth knowing.",
      version: "#4",
    },
    {
      id: "typography",
      title: "Brand typography",
      kind: "Brand",
      owner: "Sarah Ahmed",
      status: "Approved",
      description:
        "Inter for the product. Editorial serif accents for the brand story.",
      version: "V1",
    },
  ],
  feedback: [
    {
      id: "fb-1",
      target: "hero-heading",
      x: 30,
      y: 35,
      text: "Can we make this sentence shorter?",
      status: "Pending",
      created: "Oct 4, 10:24 AM",
      replies: [
        {
          text: "Yes. We are exploring a tighter headline for the next revision.",
          author: "Sarah Ahmed",
        },
      ],
    },
    {
      id: "fb-2",
      target: "passport-card",
      x: 78,
      y: 55,
      text: "The product origin should be more prominent on the passport.",
      status: "Pending",
      created: "Oct 3, 4:15 PM",
      replies: [],
    },
  ],
  activity: [
    {
      id: "a1",
      person: "Sarah",
      initials: "SA",
      action: "uploaded Homepage V3 for your review",
      time: "12:31 PM",
      type: "design",
    },
    {
      id: "a2",
      person: "Rifat",
      initials: "RH",
      action: "updated the mobile navigation",
      time: "11:58 AM",
      type: "code",
    },
    {
      id: "a3",
      person: "You",
      initials: "FK",
      action: "approved the brand typography",
      time: "11:21 AM",
      type: "approval",
    },
    {
      id: "a4",
      person: "Mahin",
      initials: "MI",
      action: "completed keyword research",
      time: "10:46 AM",
      type: "code",
    },
    {
      id: "a5",
      person: "Rifat",
      initials: "RH",
      action: "deployed staging build #41",
      time: "9:52 AM",
      type: "code",
    },
    {
      id: "a6",
      person: "Sarah",
      initials: "SA",
      action: "added 4 assets to the brand vault",
      time: "Yesterday",
      type: "asset",
    },
  ],
  assets: [
    {
      id: "logo",
      name: "Logo.svg",
      category: "Brand",
      status: "Approved",
      size: "2 KB",
      type: "SVG",
      uploaded: "Oct 2",
    },
    {
      id: "logo-dark",
      name: "Logo-dark.svg",
      category: "Brand",
      status: "Approved",
      size: "2 KB",
      type: "SVG",
      uploaded: "Oct 2",
    },
    {
      id: "guidelines",
      name: "Brand-guidelines.md",
      category: "Brand",
      status: "Approved",
      size: "1 KB",
      type: "MD",
      uploaded: "Oct 2",
    },
    {
      id: "homepage",
      name: "Homepage-copy.txt",
      category: "Content",
      status: "Awaiting Client",
      size: "1 KB",
      type: "TXT",
      uploaded: "Oct 4",
    },
    {
      id: "campaign",
      name: "Campaign-copy.txt",
      category: "Marketing",
      status: "Needs Revision",
      size: "1 KB",
      type: "TXT",
      uploaded: "Oct 3",
    },
  ],
  decisions: [
    {
      id: "d1",
      title: "Dark visual direction approved",
      date: "2026-09-28",
      type: "Decision",
      body: "The client approved the dark visual direction for the portal, with restrained green accents for the FABRIPASS product.",
      status: "Implemented",
    },
    {
      id: "d2",
      title: "Weekly product review",
      date: "2026-10-02",
      type: "Meeting",
      body: "Reviewed the homepage prototype. Agreed to shorten the hero headline, prioritize product origin, and deliver responsive navigation before October 9. Rifat owns implementation; Sarah owns the next design revision.",
      status: "Recorded",
    },
    {
      id: "d3",
      title: "Add product origin to passports",
      date: "2026-10-03",
      type: "Client request",
      body: "Surface country of origin and manufacturing partner on every passport. Included in the existing scope.",
      status: "In progress",
    },
    {
      id: "d4",
      title: "ERP connector scope confirmed",
      date: "2026-10-01",
      type: "Scope change",
      body: "Phase one includes a read-only product sync. Two-way inventory updates move to a separately scoped phase two.",
      status: "Approved",
    },
  ],
};
export const team = [
  {
    name: "Rifat Hossain",
    initials: "RH",
    role: "Frontend engineer",
    work: "Homepage development",
    active: true,
    color: "#bdc2db",
  },
  {
    name: "Sarah Ahmed",
    initials: "SA",
    role: "Product designer",
    work: "UI / UX revision",
    active: true,
    color: "#d7b7a4",
  },
  {
    name: "Mahin Islam",
    initials: "MI",
    role: "Growth specialist",
    work: "SEO setup",
    active: true,
    color: "#b3c8b5",
  },
  {
    name: "Tanvir Hasan",
    initials: "TH",
    role: "Backend engineer",
    work: "Passport API integration",
    active: false,
    color: "#b9c6d4",
  },
  {
    name: "Nadia Rahman",
    initials: "NR",
    role: "Project lead",
    work: "Strategy and delivery",
    active: false,
    color: "#c9b7d0",
  },
  {
    name: "Ayesha Khan",
    initials: "AK",
    role: "Content strategist",
    work: "Launch campaign",
    active: false,
    color: "#d2c5ad",
  },
  {
    name: "Ishrat Jahan",
    initials: "IJ",
    role: "QA engineer",
    work: "Responsive QA",
    active: false,
    color: "#b9ccd0",
  },
];
export function projectProgress(tasks: Task[]) {
  const dev = Math.round(
    tasks.filter((t) => t.floor === 2).reduce((s, t) => s + t.progress, 0) / 6,
  );
  return {
    total: Math.round(
      (tasks.find((t)=>t.id==='research')?.progress??0)*0.1 +
      (tasks.find((t)=>t.id==='strategy')?.progress??0)*0.1 +
        (tasks.find((t) => t.id === "ui")?.progress ?? 82) * 0.25 +
        dev * 0.4 +
        (tasks.find((t)=>t.id==='qa')?.progress??0)*0.1 +
        (tasks.find((t)=>t.id==='launch')?.progress??0)*0.05,
    ),
    dev,
  };
}
export const floorNames = {
  3: "Strategy & creative",
  2: "Development & production",
  1: "Marketing & launch",
};
