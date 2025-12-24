import {
  motion,
  useScroll,
  useTransform,
  MotionValue,
  useMotionValue,
} from "motion/react";
import { useState, useRef, useEffect } from "react";
import "./App.css";
import type { NotebookEntry } from "./utils.tsx";
// import * as utils from "./utils.tsx";

const currentDate = new Date();
const placeholderDate = new Date(1900);
const displayDateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const BASE_URL = "http://localhost:3000/api";

// const SEARCH_THRESHOLD = 0.8;

// database query should return in descending order of date
// const ENTRIES: NotebookEntry[] = Array.from(Array(10).keys()).map((i) => ({
//   id: uuidv4(),
//   user_id: "1",
//   title: "foo",
//   created_at: new Date(10 - i, 0),
//   updated_at: new Date(10 - i, 0),
//   deleted_at: null,
// }));

type ControlState = {
  type: "idle" | "comparing" | "awaiting";
  userId: string;
  inputText: string;
  entries: NotebookEntry[];
};

type ControlStateUpdate = ((
  update: (prev: ControlState) => ControlState,
) => void) &
  ((update: ControlState) => void);

export default function App() {
  const [control, setControl] = useState({
    type: "idle",
    userId: "",
    inputText: "",
    entries: [],
  } as ControlState);
  const ref = useRef(null);
  const scrollYProgressByDate = useRef(new Map<string, MotionValue<number>>());

  useEffect(() => {
    const setupKey = async () => {
      const encoder = new TextEncoder();
      const keyString = await getKey();
      const keyBytes = encoder.encode(keyString);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", keyBytes);
      const userId = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const entries = await getEntries(userId);
      setControl((prev) => ({
        ...prev,
        userId,
        inputText: "",
        entries,
      }));
    };
    setupKey();
  }, []);

  const uniqueEntryDates = new Set(
    control.entries
      .map((entry) => entry.created_at)
      .concat([currentDate, placeholderDate])
      .map((date) => date.toISOString().split("T")[0]),
  );

  const sortedEntryDates = Array.from(uniqueEntryDates);
  sortedEntryDates.sort();
  sortedEntryDates.reverse();

  const dayTables = sortedEntryDates.map((dateStringISO, index) => (
    <Card
      key={dateStringISO}
      control={control}
      setControl={setControl}
      scrollYProgressByDate={scrollYProgressByDate}
      dateStringISO={dateStringISO}
      index={index}
    />
  ));

  return (
    <>
      <motion.div ref={ref} className="dummy-card-container-view">
        <div style={{ height: "calc(50vh - var(--card-height) / 2)" }} />
        <DummyCardContainer
          viewRef={ref}
          scrollYProgressByDate={scrollYProgressByDate}
          entryDates={sortedEntryDates}
        />
        <div style={{ height: "calc(50vh - var(--card-height) / 2)" }} />
      </motion.div>
      {dayTables}
    </>
  );
}

function DummyCardContainer({
  viewRef,
  scrollYProgressByDate,
  entryDates,
}: {
  viewRef: React.RefObject<null>;
  scrollYProgressByDate: React.RefObject<Map<string, MotionValue<number>>>;
  entryDates: Array<string>;
}) {
  function handleScrollProgress(
    dateString: string,
    progress: MotionValue<number>,
  ) {
    scrollYProgressByDate.current.set(dateString, progress);
  }

  const dummyDayTables = entryDates.map((dateString) => (
    <DummyCard
      key={dateString}
      onScrollProgress={handleScrollProgress}
      dateString={dateString}
      viewRef={viewRef}
    />
  ));

  return (
    <>
      <div className="dummy-card-container">{dummyDayTables}</div>
    </>
  );
}

function DummyCard({
  dateString,
  viewRef,
  onScrollProgress,
}: {
  dateString: string;
  viewRef: React.RefObject<null>;
  onScrollProgress: (dateString: string, progress: MotionValue<number>) => void;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    container: viewRef,
    target: ref,
    offset: ["end end", "start start"],
  });
  useEffect(
    () => onScrollProgress(dateString, scrollYProgress),
    [onScrollProgress, dateString, scrollYProgress],
  );

  onScrollProgress(dateString, scrollYProgress);

  return <motion.div ref={ref} className="dummy-card" />;
}

function Card({
  control,
  setControl,
  scrollYProgressByDate,
  dateStringISO,
  index,
}: {
  control: ControlState;
  setControl: ControlStateUpdate;
  scrollYProgressByDate: React.RefObject<Map<string, MotionValue<number>>>;
  dateStringISO: string;
  index: number;
}) {
  const defaultScrollYProgress = useMotionValue(0);

  const scrollYProgress =
    scrollYProgressByDate.current.get(dateStringISO) ?? defaultScrollYProgress;

  const rotateX = useTransform(scrollYProgress, [0, 0.5], [90, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [350 + 5 * index, 0]);
  const z = useTransform(scrollYProgress, [0.5, 1], [0, -1200]);
  const zIndex = useTransform(() => (scrollYProgress.get() ? index : -index));
  
  const date = new Date(dateStringISO);
  const dateStringLocal = displayDateFormat.format(date);

  return (
    <motion.div
      style={{ rotateX, y, z, zIndex }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 1 } }}
      className="card"
    >
      <div
        style={{ position: "relative", height: "100%", overflowY: "scroll" }}
      >
        <DateRow dateString={dateStringLocal} />
        <div className="card-hline" style={{ borderColor: "lightcoral" }} />
        {dateStringISO === currentDate.toISOString().split("T")[0] && (
          <>
            <InputRow control={control} setControl={setControl} />
            <div
              className="card-hline"
              style={{ borderColor: "lightskyblue" }}
            />
          </>
        )}
        <EntryTable
          entries={control.entries.filter(
            (entry) =>
              entry.created_at.toISOString().split("T")[0] === dateStringISO,
          )}
        />
      </div>
      <div className="card-vline" style={{ borderColor: "lightgray" }} />
    </motion.div>
  );
}

function InputRow({
  control,
  setControl,
}: {
  control: ControlState;
  setControl: ControlStateUpdate;
}) {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: control.inputText,
      }),
    };

    const response = await fetch(
      `${BASE_URL}/users/${control.userId}/new-entry`,
      options,
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      const entries = await getEntries(control.userId);
      setControl((prev: ControlState) => ({
        ...prev,
        inputText: "",
        entries,
      }));
    }
  };

  return (
    <div className="card-input">
      {/*<form
        onSubmit={(e) => {
          e.preventDefault();
          setControl((prev: ControlState) => ({
            ...prev,
            type: "comparing",
            inputText: "",
            entries: [
              {
                id: uuidv4(),
                user_id: "1",
                title: control.inputText,
                created_at: new Date(),
                updated_at: new Date(),
                deleted_at: null,
              } as NotebookEntry,
              ...control.entries,
            ],
          }));
        }}
      >*/}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={control.inputText}
          placeholder="New entry..."
          onChange={(e) =>
            setControl((prev) => ({ ...prev, inputText: e.target.value }))
          }
        />
      </form>
    </div>
  );
}

function DateRow({ dateString }: { dateString: string }) {
  return <div className="card-title">{dateString}</div>;
}

function EntryTable({ entries }: { entries: NotebookEntry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <div key={entry.id}>
          <div className="card-content">{entry.title}</div>
          <div className="card-hline" style={{ borderColor: "lightskyblue" }} />
        </div>
      ))}
    </>
  );
}

async function getEntries(userId: string): Promise<NotebookEntry[]> {
  const options = {
    method: "GET",
    headers: {
      "content-type": "application/json",
      userId,
    },
  };

  const response = await fetch(
    `${BASE_URL}/users/${userId}/get-entries`,
    options,
  );

  if (response.ok) {
    console.log("Entries retrieved successfully!");
    const { entries } = await response.json();
    return entries.map((entry: NotebookEntry) => ({
      id: entry.id,
      title: entry.title,
      created_at: new Date(entry.created_at),
      updated_at: new Date(entry.updated_at),
      deleted_at: entry.deleted_at ? new Date(entry.deleted_at) : null,
    }));
  }

  console.log("Entries retrieval failed.");
  return [];
}

async function getKey() {
  const storedKey = localStorage.getItem("key");
  if (storedKey) {
    return storedKey;
  }
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  console.log(key);
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  const keyString = JSON.stringify(jwk);
  localStorage.setItem("key", keyString);
  return keyString;
}

// function ComparisonTable({
//   control,
//   setControl,
// }: {
//   control: ControlState;
//   setControl: ControlStateUpdate;
// }) {
//   const entryDates = new Set(
//     utils
//       .findMatches(control.inputText, control.entries, SEARCH_THRESHOLD)
//       .map((entry) => entry.created_at.toLocaleDateString()),
//   );

//   const dayTables = [...entryDates].map((dateString) => (
//     <DayTable
//       dateString={dateString}
//       control={control}
//       setControl={setControl}
//     />
//   ));
//   return <div>{dayTables}</div>;
// }
