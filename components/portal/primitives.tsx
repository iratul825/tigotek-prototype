"use client";
import { Check, ChevronRight, Circle, ExternalLink, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  ProjectState,
  Section,
  Task,
  projectProgress,
  team,
} from "@/lib/project-data";
export function Status({ value }: { value: string }) {
  return (
    <span
      className={`status ${/Approved|Complete|Implemented|On schedule|Resolved/.test(value) ? "green" : /review|Awaiting|progress|Pending/.test(value) ? "amber" : /Blocked|Changes|Revision/.test(value) ? "red" : ""}`}
    >
      <i />
      {value}
    </span>
  );
}
export function Avatar({
  initials,
  small = false,
}: {
  initials: string;
  small?: boolean;
}) {
  const person = team.find((t) => t.initials === initials);
  return (
    <span
      className={`avatar ${small ? "small" : ""}`}
      style={{
        backgroundColor: person ? person.color + "20" : undefined,
        color: person?.color,
      }}
    >
      {initials}
    </span>
  );
}
export function ProgressBar({ value }: { value: number }) {
  return (
    <Progress
      className="portal-progress"
      value={value}
      aria-label={`${value}% complete`}
    />
  );
}
export function TeamPresence({ onClick }: { onClick: () => void }) {
  return (
    <button className="team-presence" onClick={onClick}>
      <span className="avatar-stack">
        {team
          .filter((t) => t.active)
          .map((p) => (
            <Avatar key={p.initials} initials={p.initials} small />
          ))}
      </span>
      <span>
        <b>3 people working</b>
        <span>on your project</span>
      </span>
      <span className="presence-dot" />
    </button>
  );
}
export function ProjectCommandCenter({
  state,
  onNavigate,
}: {
  state: ProjectState;
  onNavigate: (s: Section) => void;
}) {
  const { total } = projectProgress(state.tasks);
  return (
    <section className="command-center">
      <div className="completion">
        <div className="completion-number">
          {total}
          <span>%</span>
        </div>
        <div>
          <span className="eyebrow">PROJECT COMPLETE</span>
          <ProgressBar value={total} />
          <span className="muted">From idea to impact.</span>
        </div>
      </div>
      <div className="command-metric">
        <span className="eyebrow">PROJECT HEALTH</span>
        <Status value="On schedule" />
        <span className="muted">Next review · Oct 9</span>
      </div>
      <button
        className="command-metric metric-button"
        onClick={() => onNavigate("Progress")}
      >
        <span className="eyebrow">NEXT MILESTONE</span>
        <b>Homepage development</b>
        <span className="muted">
          October 9, 2026 <ChevronRight size={13} />
        </span>
      </button>
      <div className="command-metric">
        <span className="eyebrow">TARGET LAUNCH</span>
        <b>
          October 26<span className="year">2026</span>
        </b>
        <span className="muted">22 days to go · demo timeline</span>
      </div>
    </section>
  );
}
export function ActivityFeed({
  items,
  full = false,
  onViewAll,
}: {
  items: Activity[];
  full?: boolean;
  onViewAll?: () => void;
}) {
  return (
    <section className={`activity-feed ${full ? "full-feed" : ""}`}>
      <div className="section-heading">
        <h3>Activity</h3>
        <span className="eyebrow">
          <span className="presence-dot" />
          PROJECT LOG
        </span>
      </div>
      <div className="activity-items">
        {items.slice(0, full ? 50 : 5).map((item) => (
          <div className="activity-item" key={item.id}>
            <Avatar initials={item.initials} small />
            <div>
              <p>
                <b>{item.person}</b> {item.action}
              </p>
              <time>{item.time}</time>
            </div>
          </div>
        ))}
      </div>
      {onViewAll && (
        <button className="text-button" onClick={onViewAll}>
          View all activity
          <ChevronRight size={14} />
        </button>
      )}
    </section>
  );
}
export function ProjectTimeline({
  tasks,
  onTask,
  full = false,
}: {
  tasks: Task[];
  onTask: (t: Task) => void;
  full?: boolean;
}) {
  const { dev } = projectProgress(tasks);
  const stages = [
    ["Discovery", 100, "research"],
    ["Strategy", 100, "strategy"],
    ["UI / UX", tasks.find((t) => t.id === "ui")?.progress ?? 82, "ui"],
    ["Development", dev, "frontend"],
    ["Testing", tasks.find((t) => t.id === "qa")?.progress ?? 0, "qa"],
    ["Launch", tasks.find((t) => t.id === "launch")?.progress ?? 0, "launch"],
  ] as const;
  return (
    <section className={`journey ${full ? "journey-full" : ""}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE BIG PICTURE</span>
          <h3>Your project journey</h3>
        </div>
        <span className="muted">Sep 21 — Oct 26</span>
      </div>
      <div className="journey-stages">
        {stages.map(([name, percent, id], i) => (
          <button
            key={name}
            className={`journey-step ${percent === 100 ? "complete" : percent > 0 ? "active" : ""}`}
            onClick={() => {
              const t = tasks.find((t) => t.id === id);
              if (t) onTask(t);
            }}
          >
            <div className="journey-line">
              <span>
                {percent === 100 ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <i />
            </div>
            <b>{name}</b>
            <small>
              {percent === 100
                ? "Completed"
                : percent === 0
                  ? "Upcoming"
                  : `${percent}% complete`}
            </small>
            <ProgressBar value={percent} />
          </button>
        ))}
      </div>
    </section>
  );
}
export function TaskDetail({
  task,
  tasks,
  onClose,
  onNavigate,
}: {
  task: Task;
  tasks: Task[];
  onClose: () => void;
  onNavigate: (s: Section) => void;
}) {
  return (
    <section className="task-detail">
      <div className="section-heading">
        <span className="eyebrow">WORKSTATION / FLOOR 0{task.floor}</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close workstation"
        >
          <X size={17} />
        </button>
      </div>
      <span className="department-label">{task.department}</span>
      <h2>{task.title}</h2>
      <Status value={task.status} />
      <div className="task-percentage">
        <b>
          {task.progress}
          <small>%</small>
        </b>
        <span>complete</span>
      </div>
      <ProgressBar value={task.progress} />
      <div className="task-owner">
        <Avatar initials={task.initials} />
        <div>
          <b>{task.assignee}</b>
          <span>Assigned specialist</span>
        </div>
      </div>
      <span className="eyebrow">DELIVERY CHECKLIST</span>
      <ul className="checklist">
        {task.checklist.map((c, i) => (
          <li key={c.title} className={c.done ? "done" : ""}>
            {c.done ? <Check size={15} /> : <Circle size={13} />}
            <span>{c.title}</span>
            {!c.done && i === task.checklist.findIndex((x) => !x.done) && (
              <i>Now</i>
            )}
          </li>
        ))}
      </ul>
      <div className="current-work">
        <span className="eyebrow">CURRENTLY WORKING ON</span>
        <p>{task.current}</p>
      </div>
      <dl>
        <dt>Due date</dt>
        <dd>
          {new Date(task.due + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </dd>
        <dt>Priority</dt>
        <dd>{task.priority}</dd>
        {task.dependency && (
          <>
            <dt>Depends on</dt>
            <dd>{tasks.find((t) => t.id === task.dependency)?.title}</dd>
          </>
        )}
      </dl>
      <div className="task-updated">{task.updated}</div>
      {task.approval && (
        <button
          className="primary-button"
          onClick={() => onNavigate("Approvals")}
        >
          Review deliverable
          <ExternalLink size={14} />
        </button>
      )}
    </section>
  );
}
