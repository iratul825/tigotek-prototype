"use client";
import { useState } from "react";
import { Expand, Layers3, MousePointer2 } from "lucide-react";
import { Task, floorNames } from "@/lib/project-data";
type Floor = 1 | 2 | 3;
const FLOOR_Y: Record<Floor, number> = { 3: 164, 2: 347, 1: 530 };
const iso = (x: number, y: number, z = 0) => [x - y, (x + y) * 0.38 - z];
const pts = (arr: number[][]) =>
  arr
    .map(([x, y, z]) => iso(x, y, z))
    .map((p) => p.join(","))
    .join(" ");
function Block({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  top = "#687079",
  front = "#343c44",
  side = "#252d35",
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  top?: string;
  front?: string;
  side?: string;
}) {
  return (
    <g stroke="#82909b33" strokeWidth=".65">
      <polygon
        points={pts([
          [x, y, z + h],
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
        fill={top}
      />
      <polygon
        points={pts([
          [x, y + d, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
        fill={front}
      />
      <polygon
        points={pts([
          [x + w, y, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x + w, y, z + h],
        ])}
        fill={side}
      />
    </g>
  );
}
function Plant({ x, y }: { x: number; y: number }) {
  const [a, b] = iso(x, y, 25);
  return (
    <g>
      <Block
        x={x - 6}
        y={y - 6}
        w={12}
        d={12}
        h={17}
        top="#56625b"
        front="#424b47"
        side="#2c3631"
      />
      <path
        d={`M${a},${b + 9}v-30m0 20q-17-9-12-22q15 3 12 22m0-9q16-20 19-9q0 10-19 14m0-7q-8-19-3-25q10 8 3 25`}
        fill="#405f50"
        stroke="#668675"
        strokeWidth="1.3"
      />
    </g>
  );
}
function Workstation({
  x,
  y,
  task,
  onTask,
  interactive = true,
}: {
  x: number;
  y: number;
  task: Task;
  onTask: (t: Task) => void;
  interactive?: boolean;
}) {
  const active = task.status === "In progress" || task.status === "In review";
  const color =
    task.status === "Complete" ? "#83bda7" : active ? "#d9ae70" : "#667581";
  return (
    <g
      className={`workstation ${active ? "working" : ""}`}
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-label={`${task.title}, ${task.progress} percent, ${task.status}`}
      onClick={(e) => {
        e.stopPropagation();
        onTask(task);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTask(task);
        }
      }}
    >
      <title>
        {task.title} · {task.progress}% · {task.assignee}
      </title>
      <polygon
        className="desk-hit"
        points={pts([
          [x - 10, y - 10, 2],
          [x + 83, y - 10, 2],
          [x + 83, y + 70, 2],
          [x - 10, y + 70, 2],
        ])}
        fill="transparent"
      />
      <Block x={x + 3} y={y + 6} w={5} d={45} h={28} />
      <Block x={x + 67} y={y + 6} w={5} d={45} h={28} />
      <Block
        x={x}
        y={y}
        z={28}
        w={78}
        d={50}
        h={5}
        top="#77746d"
        front="#484b4b"
        side="#434747"
      />
      <Block
        x={x + 17}
        y={y + 6}
        z={33}
        w={41}
        d={4}
        h={27}
        top="#78848a"
        front="#28353b"
        side="#171f26"
      />
      <polygon
        points={pts([
          [x + 20, y + 11, 36],
          [x + 55, y + 11, 36],
          [x + 55, y + 11, 57],
          [x + 20, y + 11, 57],
        ])}
        fill={active ? "#233e42" : "#26373d"}
        stroke={color}
        strokeOpacity=".4"
      />
      {[0, 1, 2, 3].map((n) => (
        <polyline
          className={active ? "code-line" : ""}
          key={n}
          points={pts([
            [x + 23, y + 11, 52 - n * 4],
            [x + 35 + n * 4, y + 11, 52 - n * 4],
          ])}
          stroke={color}
          opacity={0.3 + n * 0.1}
          strokeWidth="1.1"
        />
      ))}
      <polygon
        points={pts([
          [x + 22, y + 26, 34],
          [x + 52, y + 26, 34],
          [x + 52, y + 37, 34],
          [x + 22, y + 37, 34],
        ])}
        fill="#303b40"
      />
      <Block x={x + 57} y={y + 34} z={33} w={9} d={10} h={1} top="#c7bda3" />
      <Block
        x={x + 30}
        y={y + 51}
        w={24}
        d={22}
        h={21}
        top="#424c54"
        front="#273039"
        side="#202831"
      />
      <Block
        x={x + 28}
        y={y + 67}
        z={18}
        w={28}
        d={4}
        h={22}
        top="#59626a"
        front="#35414b"
        side="#27333d"
      />
      {active && (
        <g className="worker">
          <ellipse
            cx={iso(x + 43, y + 49, 39)[0]}
            cy={iso(x + 43, y + 49, 39)[1]}
            rx="8.5"
            ry="15"
            fill={task.floor === 3 ? "#a28d7b" : "#657985"}
          />
          <circle
            cx={iso(x + 43, y + 49, 56)[0]}
            cy={iso(x + 43, y + 49, 56)[1]}
            r="6"
            fill="#bbab9b"
          />
          <path
            d={`M${iso(x + 39, y + 48, 43).join(",")}l-13,-7m20,8l-6,-12`}
            stroke="#ab9c8f"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
      <circle
        cx={iso(x + 70, y + 3, 35)[0]}
        cy={iso(x + 70, y + 3, 35)[1]}
        r="2.5"
        fill={color}
        className={active ? "status-pulse" : ""}
      />
    </g>
  );
}
function OfficeFloor({
  floor,
  tasks,
  selected,
  onSelect,
  onTask,
}: {
  floor: Floor;
  tasks: Task[];
  selected: Floor | null;
  onSelect: (f: Floor) => void;
  onTask: (t: Task) => void;
}) {
  const y = FLOOR_Y[floor];
  const active = selected === null || selected === floor;
  return (
    <g
      className="office-floor"
      data-floor={floor}
      aria-hidden={!active}
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        transform: `translate(296px, ${y}px)`,
      }}
      onClick={() => onSelect(floor)}
    >
      <Block
        x={0}
        y={0}
        z={-8}
        w={375}
        d={186}
        h={8}
        top={floor === 3 ? "#414342" : floor === 2 ? "#39464c" : "#354139"}
        front="#232c33"
        side="#1a252c"
      />
      <polygon
        points={pts([
          [0, 0, 0],
          [375, 0, 0],
          [375, 0, 91],
          [0, 0, 91],
        ])}
        fill="#273139"
        stroke="#74839155"
      />
      <polygon
        points={pts([
          [0, 0, 0],
          [0, 186, 0],
          [0, 186, 91],
          [0, 0, 91],
        ])}
        fill="#26323a"
        stroke="#72818c55"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <polyline
          key={i}
          points={pts([
            [0, i * 31, 0],
            [375, i * 31, 0],
          ])}
          stroke="#8b959d"
          opacity=".065"
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <polyline
          key={i}
          points={pts([
            [i * 65, 0, 0],
            [i * 65, 186, 0],
          ])}
          stroke="#8b959d"
          opacity=".06"
        />
      ))}
      <polygon
        points={pts([
          [19, 2, 39],
          [94, 2, 39],
          [94, 2, 81],
          [19, 2, 81],
        ])}
        fill="#18272e"
        stroke="#82959066"
      />
      <text
        transform={`translate(${iso(24, 3, 69).join(" ")}) skewY(20.8)`}
        fill="#afc6bc"
        fontSize="6.7"
        letterSpacing="1.3"
      >
        {floor === 3
          ? "DESIGN IN MOTION"
          : floor === 2
            ? "BUILD / 041"
            : "LAUNCH / 26 OCT"}
      </text>
      <polygon
        points={pts([
          [25, 3, 46],
          [25 + (floor === 3 ? 62 : floor === 2 ? 41 : 28), 3, 46],
          [25 + (floor === 3 ? 62 : floor === 2 ? 41 : 28), 3, 49],
          [25, 3, 49],
        ])}
        fill="#b99a66"
      />
      <polyline
        points={pts([
          [0, 0, 92],
          [375, 0, 92],
        ])}
        stroke={floor === 2 ? "#ddb777" : "#9dadb5"}
        strokeWidth="2"
        opacity=".8"
      />
      <Plant x={11} y={162} />
      <Plant x={355} y={12} />
      {tasks.map((t, i) => (
        <Workstation
          key={t.id}
          x={108 + (i % 3) * 85}
          y={14 + Math.floor(i / 3) * 79}
          task={t}
          onTask={onTask}
          interactive={active}
        />
      ))}
      <Block
        x={18}
        y={42}
        w={50}
        d={85}
        h={27}
        top={floor === 3 ? "#777263" : "#4e6065"}
        front="#3c494d"
        side="#354247"
      />
      {floor === 3 ? (
        <>
          <Block x={26} y={51} z={27} w={31} d={23} h={1} top="#b8b0a1" />
          <Block x={29} y={91} z={27} w={27} d={21} h={1} top="#b9a787" />
        </>
      ) : (
        <Block
          x={27}
          y={59}
          z={27}
          w={32}
          d={3}
          h={24}
          top="#7a878b"
          front="#27433e"
        />
      )}
      <polygon
        points={pts([
          [375, 4, 0],
          [375, 182, 0],
          [375, 182, 34],
          [375, 4, 34],
        ])}
        fill="#bdd7e3"
        fillOpacity=".055"
        stroke="#a9bac855"
      />
      <polyline
        points={pts([
          [0, 186, -4],
          [375, 186, -4],
        ])}
        stroke={floor === 2 ? "#dcb473" : "#90a6b2"}
        opacity={floor === 2 ? 0.7 : 0.3}
        strokeWidth="2"
      />
    </g>
  );
}
export function AgencyOffice({
  tasks,
  onTask,
  expanded,
}: {
  tasks: Task[];
  onTask: (task: Task) => void;
  expanded?: boolean;
}) {
  const [selected, setSelected] = useState<Floor | null>(null);
  const [zoom, setZoom] = useState(false);
  // Center the selected floor's architectural bounds in the same SVG viewport.
  // Keeping the transform on one camera group lets rapid floor changes retarget
  // the running CSS transition without jumps or queued animations.
  const cameraScale = selected === null ? (zoom ? 1.16 : 1) : 1.4;
  const cameraX = selected === null ? 430 * (1 - cameraScale) : 430 - 390.5 * cameraScale;
  const cameraY = selected === null ? 392.5 * (1 - cameraScale) : 410 - (FLOOR_Y[selected] + 64.5) * cameraScale;
  const resetView = () => { setSelected(null); setZoom(false); };
  const selectFloor = (floor: Floor) => {
    setSelected(current => current === floor ? null : floor);
    setZoom(false);
  };
  return (
    <section
      className={`office-panel ${expanded ? "office-expanded" : ""}`}
      aria-label="Interactive project office"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          resetView();
        }
      }}
    >
      <div className="office-toolbar">
        <div>
          <span className="eyebrow">YOUR PROJECT, IN MOTION</span>
          <h2>
            The live office
            <span className="live-badge">
              <i />
              Live
            </span>
          </h2>
        </div>
        <button
          className="icon-button"
          aria-label={selected !== null || zoom ? "Reset office view" : "Expand office view"}
          onClick={() => selected !== null || zoom ? resetView() : setZoom(true)}
        >
          <Expand size={17} />
        </button>
      </div>
      <div className="office-scene" data-selected-floor={selected ?? "all"}>
        <div className="floor-navigation">
          <button
            className={selected === null ? "selected" : ""}
            onClick={resetView}
            aria-label="Show all floors"
            aria-pressed={selected === null}
            title="Show all floors"
          >
            <Layers3 size={16} />
          </button>
          {([3, 2, 1] as const).map((f) => (
            <button
              key={f}
              className={selected === f ? "selected" : ""}
              onClick={() => selectFloor(f)}
              aria-label={`Show floor ${f}: ${floorNames[f]}`}
              aria-pressed={selected === f}
              title={floorNames[f]}
            >
              {String(f).padStart(2, "0")}
            </button>
          ))}
        </div>
        <div className={`floor-focus-label ${selected !== null ? "visible" : ""}`} aria-live="polite" aria-atomic="true">
          {selected !== null && <><span className="eyebrow">FLOOR 0{selected}</span><b>{floorNames[selected]}</b><span>6 workstations · select one to explore</span></>}
        </div>
        <svg
          className="office-drawing"
          viewBox="0 0 860 785"
          aria-label="Three-storey cutaway office with clickable task workstations"
        >
          <defs>
            <pattern
              id="grid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M36 0H0V36"
                fill="none"
                stroke="#607684"
                strokeWidth=".4"
                opacity=".13"
              />
            </pattern>
            <radialGradient id="floor-glow">
              <stop stopColor="#aa8c50" stopOpacity=".10" />
              <stop offset="1" stopColor="#10191f" stopOpacity="0" />
            </radialGradient>
            <filter id="shadow">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <rect width="860" height="785" fill="url(#grid)" />
          <ellipse
            cx="427"
            cy="690"
            rx="330"
            ry="110"
            fill="url(#floor-glow)"
            className="office-ground"
            style={{ opacity: selected === null ? 1 : 0 }}
          />
          <ellipse
            cx="430"
            cy="705"
            rx="245"
            ry="40"
            fill="#000"
            className="office-ground"
            style={{ opacity: selected === null ? 0.38 : 0 }}
            filter="url(#shadow)"
          />
          <g className="office-camera" style={{transform: `translate(${cameraX}px, ${cameraY}px) scale(${cameraScale})`}}>
          {([1, 2, 3] as const).map((f) => (
            <OfficeFloor
              key={f}
              floor={f}
              tasks={tasks.filter((t) => t.floor === f)}
              selected={selected}
              onSelect={selectFloor}
              onTask={onTask}
            />
          ))}
          </g>
          {([3, 2, 1] as const).map((f, i) => (
            <g key={f} className="office-floor-label" style={{opacity:selected === null ? 1 : 0}} aria-hidden={selected !== null}>
              <path
                d={`M671 ${285 + i * 183}h33l16 -10h85`}
                stroke="#8b9aa1"
                strokeOpacity=".28"
                fill="none"
              />
              <circle
                cx="671"
                cy={285 + i * 183}
                r="3"
                fill={f === 2 ? "#d7ac65" : "#78988b"}
              />
              <text
                x="717"
                y={255 + i * 183}
                fill="#e2e6e5"
                fontSize="12"
                letterSpacing="1.8"
              >
                FLOOR 0{f}
              </text>
              <text x="717" y={273 + i * 183} fill="#91a0a9" fontSize="10">
                {f === 3
                  ? "STRATEGY & CREATIVE"
                  : f === 2
                    ? "DEVELOPMENT"
                    : "MARKETING & LAUNCH"}
              </text>
              <text
                x="717"
                y={296 + i * 183}
                fill={f === 2 ? "#d6b276" : "#91a0a9"}
                fontSize="11"
              >
                {Math.round(
                  tasks
                    .filter((t) => t.floor === f)
                    .reduce((s, t) => s + t.progress, 0) / 6,
                )}
                % COMPLETE
              </text>
            </g>
          ))}
        </svg>
        <div className="office-caption">
          <span>
            <MousePointer2 size={13} />
            Select a workstation to step inside
          </span>
          <span className="office-key">
            <i />
            Working
            <i />
            Complete
            <i />
            Upcoming
          </span>
        </div>
      </div>
      <div className="mobile-floors">
        {([3, 2, 1] as const).map((f) => (
          <div key={f}>
            <span className="eyebrow">FLOOR 0{f}</span>
            <h3>{floorNames[f]}</h3>
            {tasks
              .filter((t) => t.floor === f)
              .sort((a,b)=>Number(a.status==='Complete')-Number(b.status==='Complete') || Number(b.priority==='High')-Number(a.priority==='High'))
              .slice(0, 3)
              .map((t) => (
                <button key={t.id} onClick={() => onTask(t)}>
                  <span>{t.title}</span>
                  <b>{t.progress}%</b>
                </button>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
