import express from "express";
import cors from "cors";
import * as db from "./db.js";

const config = {
  port: process.env.PORT || 80,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
};

console.log("Config:", config);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

app.get("/api/users/:id/entries", async (req, res) => {
  console.log("incoming GET");
  const userId = req.params.id;
  const entries = await db.getNotebookEntries(userId);
  return res.status(200).json({ entries });
});

app.post("/api/users/:id/entries", async (req, res) => {
  console.log("incoming POST");
  const userId = req.params.id;
  const { title } = req.body;
  await db.createNotebookEntry(userId, title);
  return res.status(200).json({ message: "Entry created" });
});

// app.patch("/api/users/:id/entries", async (req, res) => {
//   console.log("incoming PATCH");
//   const userId = req.params.id;
//   const { title, id } = req.body;
//   await db.updateNotebookEntry(userId, id, title);
//   return res.status(200).json({ message: "Entry modified" });
// });

app.delete("/api/users/:id/entries", async (req, res) => {
  console.log("incoming DELETE");
  const userId = req.params.id;
  const { entryId } = req.body;
  const entries = await db.deleteNotebookEntry(userId, entryId);
  if (entries.length === 0) {
    return res.status(404).json({ message: "Entry not found" });
  }
  return res.status(200).json({ entries });
});

app.get("/api/test", async (req, res) => {
  console.log("test");
  return res.sendStatus(200);
});

app.listen(config.port, () =>
  console.log(`API listening on port ${config.port}`),
);
