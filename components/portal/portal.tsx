"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Monitor,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Section, Task } from "@/lib/project-data";
import { useProject } from "@/hooks/use-project";
import { usePreviewReview } from "@/hooks/use-preview-review";

import { PreviewLinkCard, PreviewDiscussion } from "./preview-review";
import { AgencyOffice } from "./office";
import {
  ActivityFeed,
  Avatar,
  ProjectCommandCenter,
  ProjectTimeline,
  TaskDetail,
  TeamPresence,
} from "./primitives";
import { ApprovalCenter, FeedbackPanel } from "./reviews";
import { LivePreview } from "./preview";
import {
  AssetVault,
  DecisionLog,
  ProgressView,
  SettingsView,
  TaskBoard,
  TeamView,
} from "./work-views";
const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Live Office", icon: Building2 },
  { label: "Progress", icon: Gauge },
  { label: "Staging", icon: Monitor },
  { label: "Tasks", icon: ListTodo },
  { label: "Feedback", icon: MessageSquare },
  { label: "Approvals", icon: CheckCheck },
  { label: "Assets", icon: FolderOpen },
  { label: "Meetings", icon: CalendarDays },
  { label: "Activity", icon: Activity },
  { label: "Team", icon: Users },
  { label: "Settings", icon: Settings },
] as const;
const headings: Record<Section, [string, string]> = {
  Overview: [
    "Great work is taking shape.",
    "Your digital product passport is coming to life. Here’s where we are.",
  ],
  "Live Office": [
    "Step inside your project.",
    "A live view of the people, decisions, and work moving your project forward.",
  ],
  Progress: [
    "Every milestone, in sight.",
    "A shared path from discovery to launch.",
  ],
  Staging: [
    "See it. Try it. Shape it.",
    "Explore the current build and leave feedback right where it matters.",
  ],
  Tasks: [
    "The work behind the progress.",
    "Every task has an owner. Every detail has a place.",
  ],
  Feedback: [
    "Your feedback, connected.",
    "Keep the conversation attached to the work.",
  ],
  Approvals: [
    "A clear path to yes.",
    "Your decisions give the next phase its momentum.",
  ],
  Assets: [
    "The asset vault.",
    "One considered home for everything your team needs.",
  ],
  Meetings: [
    "Decisions that move us forward.",
    "The important conversations, captured for the long run.",
  ],
  Activity: [
    "Every meaningful update.",
    "A project record you can always come back to.",
  ],
  Team: [
    "Your team, in focus.",
    "The specialists bringing your project to life.",
  ],
  Settings: [
    "Your workspace, your way.",
    "Manage project details and the way you stay in the loop.",
  ],
};
function Navigation({
  section,
  onNavigate,
  pending,
  name,
}: {
  section: Section;
  onNavigate: (s: Section) => void;
  pending: number;
  name: string;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar className="portal-sidebar">
      <SidebarHeader>
        <a
          className="brand"
          href="https://www.tigotek.net/"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/tigotek.svg" alt="Tigotek" />
          <span>CLIENT WORKSPACE</span>
        </a>
        <div className="project-switch">
          <span className="project-symbol">f.</span>
          <div>
            <b>{name}</b>
            <span>Digital product passport</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="nav-heading">WORKSPACE</div>
        <nav aria-label="Primary navigation">
          {navigation.map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              className={`nav-item ${section === label ? "active" : ""} ${i === 8 ? "nav-break" : ""}`}
              aria-current={section === label ? "page" : undefined}
              onClick={() => {
                onNavigate(label);
                setOpenMobile(false);
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {label === "Approvals" && pending > 0 && <em>{pending}</em>}
              {label === "Live Office" && <i className="presence-dot" />}
            </button>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <div className="sidebar-note">
          <Zap size={16} />
          <div>
            <b>Clarity, at every step.</b>
            <span>
              Your team. Your progress.
              <br />
              All in one place.
            </span>
          </div>
        </div>
        <button className="account" onClick={() => onNavigate("Settings")}>
          <Avatar initials="FK" />
          <span>
            <b>{name} team</b>
            <small>Client · demo account</small>
          </span>
          <Settings size={15} />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
export default function Portal() {
  const [section, setSection] = useState<Section>("Overview");
  const store = useProject();
  const reviewStore = usePreviewReview();
  const { state } = store;

  const [selected, setSelected] = useState<Task | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [focusFeedback, setFocusFeedback] = useState("");
  const [compact, setCompact] = useState(false);
  const pending = state.approvals.filter((a) => a.status !== "Approved").length;
  const officeSection = section === "Overview" || section === "Live Office";
  useEffect(() => {
    const read = () => {
      let name = "";
      try {
        name = decodeURIComponent(location.hash.slice(1));
      } catch {}
      if (navigation.some((n) => n.label === name)) {
        setSection(name as Section);
        setSelected(null);
      }
    };
    read();
    addEventListener("hashchange", read);
    const mq = matchMedia("(max-width:1020px)");
    const resize = () => setCompact(mq.matches);
    resize();
    mq.addEventListener("change", resize);
    return () => {
      removeEventListener("hashchange", read);
      mq.removeEventListener("change", resize);
    };
  }, []);
  const navigate = useCallback((s: Section) => {
    setSection(s);
    setSelected(null);
    location.hash = encodeURIComponent(s);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const task = selected
    ? state.tasks.find((t) => t.id === selected.id) || selected
    : null;
  return (
    <SidebarProvider
      className={`portal ${!state.settings.motion ? "reduce-motion" : ""}`}
      style={{ "--sidebar-width": "224px" } as React.CSSProperties}
    >
      <Navigation
        section={section}
        onNavigate={navigate}
        pending={pending}
        name={state.settings.name}
      />
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <SidebarTrigger className="mobile-trigger" />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{section}</b>
          </div>
          <div className="topbar-actions">
            <span className="demo-label">DEMO PROJECT</span>
            <button
              className="icon-button notification-trigger"
              aria-label="Open notifications"
              onClick={() => setNotificationOpen(true)}
            >
              <Bell size={18} />
              {pending > 0 && state.settings.notifications && <i />}
            </button>
            <span className="topbar-divider" />
            <Avatar initials="FK" small />
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">TIGOTEK × {state.settings.name}</span>
              <h1>{headings[section][0]}</h1>
              <p>{headings[section][1]}</p>
            </div>
            {section !== "Staging" && (
              <button
                className="secondary-button preview-link"
                onClick={() => navigate("Staging")}
              >
                <Monitor size={16} />
                Open live preview
                <ExternalIcon />
              </button>
            )}
          </div>
          {store.error && (
            <div role="alert" className="connection-banner">
              <span>{store.error} Showing the demo snapshot.</span>
              <button onClick={store.refresh}>Retry connection</button>
            </div>
          )}
          {officeSection ? (
            <>
              <ProjectCommandCenter state={state} onNavigate={navigate} />
              <div className="workspace-columns">
                <div className="main-column">
                  <div className="project-context">
                    <span>
                      <span className="project-symbol mini">f.</span>
                      <b>{state.settings.name}</b>
                      <span className="muted">Digital product passport</span>
                    </span>
                    <span className="phase-label">PHASE 04 · DEVELOPMENT</span>
                  </div>
                  <AgencyOffice
                    tasks={state.tasks}
                    onTask={setSelected}
                    expanded={section === "Live Office"}
                  />
                  <PreviewLinkCard store={reviewStore} onReview={() => navigate("Staging")} />
                  <ProjectTimeline tasks={state.tasks} onTask={setSelected} />
                  <div className="overview-bottom">
                    <span>DON’T ASK WHERE YOUR PROJECT IS.</span>
                    <b>Watch it being built.</b>
                    <span>Accountability is the product.</span>
                  </div>
                </div>
                <aside className="context-rail">
                  {task && !compact ? (
                    <TaskDetail
                      task={task}
                      tasks={state.tasks}
                      onClose={() => setSelected(null)}
                      onNavigate={navigate}
                    />
                  ) : (
                    <>
                      <TeamPresence onClick={() => navigate("Team")} />
                      <div className="attention-panel">
                        <div className="section-heading">
                          <span className="eyebrow">YOUR NEXT MOVE</span>
                          <span className="attention-count">{pending}</span>
                        </div>
                        <h3>
                          {pending ? (
                            <>
                              A little input.
                              <br />A lot of momentum.
                            </>
                          ) : (
                            <>
                              All clear.
                              <br />
                              Onward we go.
                            </>
                          )}
                        </h3>
                        <p>
                          {pending
                            ? `Your team is ready for feedback on ${pending} deliverables.`
                            : "Your deliverables are approved. Explore the latest build while your team keeps moving."}
                        </p>
                        <button
                          className="primary-button"
                          onClick={() =>
                            navigate(pending ? "Approvals" : "Staging")
                          }
                        >
                          {pending ? "Review approvals" : "Explore staging"}
                          <ChevronRight size={16} />
                        </button>
                        <small>
                          {pending
                            ? "Your feedback keeps the next phase moving."
                            : "Every decision, saved in the project history."}
                        </small>
                      </div>
                      <ActivityFeed
                        items={state.activity}
                        onViewAll={() => navigate("Activity")}
                      />
                      <div className="next-meeting">
                        <CalendarDays size={18} />
                        <div>
                          <span className="eyebrow">NEXT CHECK-IN</span>
                          <b>Weekly product review</b>
                          <span>Oct 9 · 3:00 PM, Dhaka</span>
                          <button
                            className="text-button"
                            onClick={() => navigate("Meetings")}
                          >
                            View meeting notes
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </aside>
              </div>
            </>
          ) : (
            <div className="route-view" key={section}>
              {section === "Progress" ? (
                <ProgressView store={store} onTask={setSelected} />
              ) : section === "Staging" ? (
                <LivePreview
                  store={store}
                  reviewStore={reviewStore}
                  onNavigate={navigate}
                  onFocusFeedback={setFocusFeedback}
                />
              ) : section === "Tasks" ? (
                <TaskBoard tasks={state.tasks} onTask={setSelected} />
              ) : section === "Feedback" ? (
                reviewStore.state.url ? <div className="shared-feedback-page"><PreviewLinkCard store={reviewStore} onReview={() => navigate("Staging")} /><PreviewDiscussion store={reviewStore} /><details className="demo-feedback-details"><summary>Previous demo comments</summary>
                <FeedbackPanel
                  store={store}
                  onNavigate={navigate}
                  focusId={focusFeedback}
                />
                </details></div> : <FeedbackPanel store={store} onNavigate={navigate} focusId={focusFeedback} />
              ) : section === "Approvals" ? (
                <ApprovalCenter store={store} onNavigate={navigate} />
              ) : section === "Assets" ? (
                <AssetVault store={store} />
              ) : section === "Meetings" ? (
                <DecisionLog store={store} />
              ) : section === "Activity" ? (
                <div className="section-page">
                  <ActivityFeed items={state.activity} full />
                </div>
              ) : section === "Team" ? (
                <TeamView store={store} onTask={setSelected} />
              ) : store.ready ? (
                <SettingsView store={store} onPreview={() => navigate("Staging")} />
              ) : (
                <div className="empty-state">
                  Connecting to workspace preferences…
                </div>
              )}
            </div>
          )}
        </main>
        <footer className="workspace-footer">
          <span>
            <span className="presence-dot" />
            {store.ready ? "Workspace connected" : "Connecting to workspace"}
          </span>
          <span>Demo project · sample team presence</span>
          <a
            href="https://www.tigotek.net/contact"
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={14} />
            Contact your agency
          </a>
        </footer>
      </div>
      <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
        <SheetContent className="portal-sheet">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {state.settings.notifications
              ? "Updates that need your attention."
              : "Approval notifications are paused in Settings."}
          </SheetDescription>
          <div className="notification-list">
            {state.settings.notifications &&
              state.approvals
                .filter((a) => a.status !== "Approved")
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setNotificationOpen(false);
                      navigate("Approvals");
                    }}
                  >
                    <CheckCheck size={19} />
                    <span>
                      <b>
                        {a.title} {a.version}
                      </b>
                      <small>{a.status}</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
            {pending === 0 && <p>You’re all caught up.</p>}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet
        open={!!task && (!officeSection || compact)}
        onOpenChange={(v) => !v && setSelected(null)}
      >
        <SheetContent className="portal-sheet task-sheet">
          <SheetTitle className="sr-only">Workstation detail</SheetTitle>
          <SheetDescription className="sr-only">
            Task progress, owner, dependencies, and delivery checklist.
          </SheetDescription>
          {task && (
            <TaskDetail
              task={task}
              tasks={state.tasks}
              onClose={() => setSelected(null)}
              onNavigate={navigate}
            />
          )}
        </SheetContent>
      </Sheet>
      <Toaster position="bottom-right" theme="dark" />
    </SidebarProvider>
  );
}
function ExternalIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
    >
      <path d="M6 3H3v10h10v-3M9 2h5v5M7 9l7-7" />
    </svg>
  );
}
