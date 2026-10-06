"use client";
import { useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Download,
  File,
  FileText,
  FolderOpen,
  GitBranch,
  LayoutGrid,
  List,
  Plus,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ProjectStore } from "@/hooks/use-project";
import { Task, Decision, team, projectProgress } from "@/lib/project-data";
import { Avatar, ProgressBar, ProjectTimeline, Status } from "./primitives";
export function TaskBoard({
  tasks,
  onTask,
}: {
  tasks: Task[];
  onTask: (t: Task) => void;
}) {
  const [view, setView] = useState("Board");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const shown = tasks.filter(
    (t) =>
      (department === "All departments" || t.department === department) &&
      `${t.title} ${t.assignee} ${t.department}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const lanes = ["Upcoming", "In progress", "In review", "Complete"];
  return (
    <section className="section-page">
      <div className="view-toolbar">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            {[
              { label: "Board", icon: LayoutGrid },
              { label: "List", icon: List },
              { label: "Timeline", icon: GitBranch },
            ].map(({ label, icon: Icon }) => (
              <TabsTrigger key={label} value={label}>
                <Icon size={14} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="table-filters">
          <div className="search-field">
            <Search size={15} />
            <input
              aria-label="Search tasks"
              placeholder="Search tasks or people…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger aria-label="Filter department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "All departments",
                ...new Set(tasks.map((t) => t.department)),
              ].map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="view-summary">
        <span>{shown.length} tasks</span>
        <span>
          October delivery cycle ·{" "}
          {tasks.filter((t) => t.status === "Complete").length} complete
        </span>
      </div>
      {view === "Board" ? (
        <div className="task-board">
          {lanes.map((lane) => (
            <div className="task-lane" key={lane}>
              <h3>
                <Status value={lane} />
                <span>
                  {
                    shown.filter(
                      (t) =>
                        t.status === lane ||
                        (lane === "Upcoming" && t.status === "Blocked"),
                    ).length
                  }
                </span>
              </h3>
              {shown
                .filter(
                  (t) =>
                    t.status === lane ||
                    (lane === "Upcoming" && t.status === "Blocked"),
                )
                .map((t) => (
                  <button
                    className="task-card"
                    key={t.id}
                    onClick={() => onTask(t)}
                  >
                    <div className="section-heading">
                      <span className="eyebrow">{t.department}</span>
                      {t.priority === "High" && (
                        <span className="priority-mark">High</span>
                      )}
                    </div>
                    <h4>{t.title}</h4>
                    {t.status === "Blocked" && <Status value="Blocked" />}
                    <div className="task-card-progress">
                      <ProgressBar value={t.progress} />
                      <span>{t.progress}%</span>
                    </div>
                    <div className="task-card-footer">
                      <Avatar initials={t.initials} small />
                      <span>{t.assignee.split(" ")[0]}</span>
                      <time>Oct {t.due.slice(-2)}</time>
                    </div>
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : view === "List" ? (
        <div className="table-panel">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Task",
                  "Department",
                  "Assignee",
                  "Status",
                  "Priority",
                  "Progress",
                  "Due",
                  "Dependency",
                  "Approval",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <button
                      className="task-name-button"
                      onClick={() => onTask(t)}
                    >
                      {t.title}
                    </button>
                  </TableCell>
                  <TableCell>{t.department}</TableCell>
                  <TableCell>
                    <span className="table-assignee">
                      <Avatar initials={t.initials} small />
                      {t.assignee}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Status value={t.status} />
                  </TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.progress}%</TableCell>
                  <TableCell>Oct {t.due.slice(-2)}</TableCell>
                  <TableCell>
                    {tasks.find((d) => d.id === t.dependency)?.title || "—"}
                  </TableCell>
                  <TableCell>
                    {t.approval ? "Client review" : "Not required"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="task-timeline">
          <div className="timeline-labels">
            <span>DELIVERABLE</span>
            <span>OCT 1</span>
            <span>OCT 9</span>
            <span>OCT 18</span>
            <span>OCT 26</span>
          </div>
          {shown.map((t) => (
            <button
              key={t.id}
              className="timeline-task"
              onClick={() => onTask(t)}
            >
              <span>
                {t.title}
                <small>{t.assignee}</small>
              </span>
              <div>
                <i
                  style={{
                    left: `${Math.max(0, Number(t.due.slice(-2)) - 7) * 3}%`,
                    width: `${t.status === "Complete" ? 18 : 24}%`,
                  }}
                  className={t.status === "Complete" ? "finished" : ""}
                >
                  <span>{t.progress}%</span>
                </i>
              </div>
            </button>
          ))}
        </div>
      )}
      {!shown.length && (
        <div className="empty-state">
          <Search size={30} />
          <h3>No matching work.</h3>
          <p>Try another task name or department.</p>
        </div>
      )}
    </section>
  );
}
export function ProgressView({
  store,
  onTask,
}: {
  store: ProjectStore;
  onTask: (t: Task) => void;
}) {
  const { total, dev } = projectProgress(store.state.tasks);
  return (
    <section className="section-page">
      <div className="progress-hero">
        <div
          className="progress-orbit"
          style={{ "--progress": `${total}%` } as React.CSSProperties}
        >
          <div>
            <b>
              {total}
              <small>%</small>
            </b>
            <span>PROJECT COMPLETE</span>
          </div>
        </div>
        <div>
          <span className="eyebrow">STEADY PROGRESS. SHARED VISIBILITY.</span>
          <h2>
            From the first idea
            <br />
            to the final handoff.
          </h2>
          <p>
            The foundation is set. Your team is building the experience
            <br className="desktop-only" /> and preparing for a confident
            October 26 launch.
          </p>
          <Status value="On schedule" />
        </div>
      </div>
      <ProjectTimeline tasks={store.state.tasks} onTask={onTask} full />
      <div className="milestones">
        <div className="section-heading">
          <h3>The next checkpoints</h3>
          <span className="muted">TARGET DATES</span>
        </div>
        {[
          {
            id: "frontend",
            date: "09",
            month: "OCT",
            title: "Homepage development",
            text: "Responsive homepage ready for your review",
            progress: 76,
          },
          {
            id: "backend",
            date: "12",
            month: "OCT",
            title: "Passport API connected",
            text: "Product provenance flows into the portal",
            progress: 38,
          },
          {
            id: "qa",
            date: "16",
            month: "OCT",
            title: "Responsive and accessibility QA",
            text: "A tested experience on every screen",
            progress: 0,
          },
          {
            id: "launch",
            date: "26",
            month: "OCT",
            title: "Go live",
            text: "Release, verify, and hand over",
            progress: 0,
          },
        ].map((m) => (
          <button
            className="milestone-row"
            key={m.id}
            onClick={() =>
              onTask(store.state.tasks.find((t) => t.id === m.id)!)
            }
          >
            <span className="date-block">
              <b>{m.date}</b>
              <small>{m.month}</small>
            </span>
            <span>
              <b>{m.title}</b>
              <small>{m.text}</small>
            </span>
            <div>
              <ProgressBar value={m.progress} />
              <span>{m.progress}%</span>
            </div>
          </button>
        ))}
      </div>
      <p className="form-hint">
        Completion is weighted by delivery phase: discovery 10%, strategy 10%,
        design 25%, development 40%, testing 10%, launch 5%. Development is
        currently {dev}% complete.
      </p>
    </section>
  );
}
export function AssetVault({ store }: { store: ProjectStore }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const shown = store.state.assets.filter(
    (a) =>
      (category === "All" || a.category === category) &&
      a.name.toLowerCase().includes(search.toLowerCase()),
  );
  async function upload(files: FileList | File[]) {
    if (uploading || store.busy) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("category", category === "All" ? "Content" : category);
        if (!(await store.send(body))) return;
      }
      if (input.current) input.current.value = "";
    } finally {
      setUploading(false);
    }
  }
  return (
    <section className="section-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">EVERYTHING, IN ITS PLACE</span>
          <h2>Your project’s source of truth.</h2>
          <p>
            Brand foundations, content, and campaign materials. Ready when you
            need them.
          </p>
        </div>
        <button
          className="primary-button"
          disabled={!store.ready || uploading}
          onClick={() => input.current?.click()}
        >
          <Upload size={15} />
          Upload assets
        </button>
      </div>
      <div className="view-toolbar">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            {["All", "Brand", "Content", "Marketing"].map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="search-field">
          <Search size={15} />
          <input
            aria-label="Search assets"
            placeholder="Find a file…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <input
        className="sr-only"
        type="file"
        multiple
        ref={input}
        aria-label="Choose asset files"
        accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.txt,.md,.csv,.docx,.zip,.woff,.woff2,.ttf,.otf,.mp4"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
      <button
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        disabled={!store.ready || uploading}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (store.ready) upload(e.dataTransfer.files);
        }}
      >
        <Upload size={24} />
        <b>
          {uploading
            ? "Saving your assets…"
            : "Drop files here, or choose files"}
        </b>
        <span>
          Images, documents, fonts, archives, or MP4 · Up to {process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true' ? '3.5' : '10'} MB each ·
          Uploading to {category === "All" ? "Content" : category}
        </span>
      </button>
      <div className="table-panel">
        <Table>
          <TableHeader>
            <TableRow>
              {["File", "Category", "Status", "Size", "Added", ""].map(
                (h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <span className="asset-filename">
                    <span className="file-type">
                      <FileText size={19} />
                      <small>{a.type}</small>
                    </span>
                    {a.name}
                  </span>
                </TableCell>
                <TableCell>{a.category}</TableCell>
                <TableCell>
                  <Status value={a.status} />
                </TableCell>
                <TableCell>{a.size}</TableCell>
                <TableCell>{a.uploaded}</TableCell>
                <TableCell>
                  <a
                    className="icon-button"
                    href={a.key ? `/api/assets/${a.id}` : `/assets/${a.name}`}
                    download={a.name}
                    aria-label={`Download ${a.name}`}
                  >
                    <Download size={16} />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!shown.length && (
        <div className="empty-state">
          <FolderOpen size={32} />
          <h3>No files in this view.</h3>
          <p>Choose a different category, or upload the first file.</p>
        </div>
      )}
    </section>
  );
}
export function DecisionLog({ store }: { store: ProjectStore }) {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Decision["type"]>("Client request");
  return (
    <section className="section-page">
      <div className="meeting-banner">
        <div className="meeting-date">
          <b>09</b>
          <span>OCTOBER</span>
        </div>
        <div>
          <span className="eyebrow">NEXT PROJECT CHECK-IN</span>
          <h2>Weekly product review</h2>
          <p>Friday, October 9 · 3:00–3:30 PM, Asia/Dhaka</p>
          <span>With Nadia, Sarah, and Rifat</span>
        </div>
        <a className="secondary-button" href="/product-review.ics" download>
          <CalendarDays size={15} />
          Add to calendar
        </a>
      </div>
      <div className="view-toolbar">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {[
              "All",
              "Meeting",
              "Decision",
              "Client request",
              "Scope change",
            ].map((v) => (
              <TabsTrigger key={v} value={v}>
                {v === "All" ? "All records" : v}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <button className="primary-button" onClick={() => setOpen(true)}>
          <Plus size={15} />
          Add a record
        </button>
      </div>
      <div className="decision-log">
        {store.state.decisions
          .filter((d) => filter === "All" || d.type === filter)
          .map((d) => (
            <article key={d.id}>
              <div className="decision-date">
                {new Date(d.date + "T12:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                })}
                <span>2026</span>
              </div>
              <div className="decision-content">
                <div className="section-heading">
                  <span className="eyebrow">{d.type}</span>
                  <Status value={d.status} />
                </div>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
                <span className="record-author">
                  <Avatar
                    initials={d.type === "Client request" ? "FK" : "NR"}
                    small
                  />
                  {d.type === "Client request"
                    ? "Client record"
                    : "Project decision history"}
                </span>
              </div>
            </article>
          ))}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="portal-sheet">
          <SheetTitle>A decision worth keeping.</SheetTitle>
          <SheetDescription>
            Add a project record the team can refer back to.
          </SheetDescription>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await store.send({
                  type: "decision",
                  id: crypto.randomUUID(),
                  title,
                  body,
                  kind,
                })
              ) {
                setOpen(false);
                setTitle("");
                setBody("");
              }
            }}
          >
            <label className="field-label">Record type</label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as Decision["type"])}
            >
              <SelectTrigger aria-label="Record type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Decision", "Meeting", "Client request", "Scope change"].map(
                  (v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <label className="field-label" htmlFor="record-title">
              Title
            </label>
            <input
              id="record-title"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did we decide?"
            />
            <label className="field-label" htmlFor="record-body">
              Details and next steps
            </label>
            <textarea
              id="record-body"
              rows={7}
              required
              maxLength={3000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Capture the context, decision, and owner…"
            />
            <button
              className="primary-button"
              disabled={
                store.busy || !store.ready || !title.trim() || !body.trim()
              }
            >
              Save project record
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </section>
  );
}
export function TeamView({
  store,
  onTask,
}: {
  store: ProjectStore;
  onTask: (t: Task) => void;
}) {
  const [person, setPerson] = useState(team[0].name);
  return (
    <section className="section-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">GOOD PEOPLE. ACCOUNTABLE WORK.</span>
          <h2>Meet the people behind the progress.</h2>
          <p>
            Seven specialists. One shared goal. Demo presence shows three people
            working.
          </p>
        </div>
      </div>
      <div className="team-layout">
        <div className="team-roster">
          {team.map((p) => (
            <button
              key={p.name}
              className={`person-row ${person === p.name ? "selected" : ""}`}
              onClick={() => setPerson(p.name)}
            >
              <Avatar initials={p.initials} />
              <span>
                <b>{p.name}</b>
                <small>{p.role}</small>
              </span>
              <span className={`team-status ${p.active ? "online" : ""}`}>
                {p.active ? "Working" : "Away"}
              </span>
            </button>
          ))}
        </div>
        <div className="person-work">
          <span className="eyebrow">ON THE DESK OF</span>
          <h2>{person}</h2>
          <p>{team.find((p) => p.name === person)?.role}</p>
          {store.state.tasks
            .filter((t) => t.assignee === person)
            .map((t) => (
              <button
                className="person-task"
                key={t.id}
                onClick={() => onTask(t)}
              >
                <span>
                  <b>{t.title}</b>
                  <Status value={t.status} />
                </span>
                <span>{t.progress}%</span>
              </button>
            ))}
        </div>
      </div>
    </section>
  );
}
export function SettingsView({ store, onPreview }: { store: ProjectStore; onPreview: () => void }) {
  const [form, setForm] = useState(store.state.settings);
  return (
    <section className="section-page settings-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>Workspace preferences.</h2>
          <p>A few details to make your project workspace feel right.</p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          store.send({ type: "settings", ...form });
        }}
      >
        <div className="settings-group">
          <h3>Project details</h3>
          <p>Your client-facing project name and staging environment.</p>
          <label className="field-label" htmlFor="project-name">
            Project name
          </label>
          <input
            id="project-name"
            required
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <h3>Preview & client feedback</h3>
          <p>Save your Vercel preview link in Staging. Invited clients can review the latest build and leave suggestions together.</p>
          <button type="button" className="secondary-button" onClick={onPreview}>Manage preview link</button>
        </div>
        <div className="settings-group">
          <h3>Your experience</h3>
          <div className="setting-toggle">
            <label htmlFor="notifications">
              <b>Approval notifications</b>
              <span>Show pending-review notifications in this workspace.</span>
            </label>
            <Switch
              id="notifications"
              checked={form.notifications}
              onCheckedChange={(v) => setForm({ ...form, notifications: v })}
            />
          </div>
          <div className="setting-toggle">
            <label htmlFor="motion">
              <b>Office animation</b>
              <span>
                Subtle activity and transitions. System reduced-motion settings
                are always respected.
              </span>
            </label>
            <Switch
              id="motion"
              checked={form.motion}
              onCheckedChange={(v) => setForm({ ...form, motion: v })}
            />
          </div>
        </div>
        <div className="settings-group">
          <h3>Connected to Tigotek</h3>
          <p>
            This is a separate client portal. Link your existing Client Login
            button to its published address.
          </p>
          <a
            className="text-button"
            href="https://www.tigotek.net/"
            target="_blank"
            rel="noreferrer"
          >
            Visit Tigotek
          </a>
        </div>
        <button
          className="primary-button"
          disabled={store.busy || !store.ready}
        >
          Save preferences
        </button>
      </form>
    </section>
  );
}
