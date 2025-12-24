import express from "express";
import cors from "cors";
import * as db from "./db.js";

const config = {
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

app.post("/api/users/:id/new-entry", async (req, res) => {
  const userId = req.params.id;
  const { title } = req.body;
  await db.createNotebookEntry(userId, title);
  return res.status(200).json({ message: "Entry created" });
});

app.get("/api/users/:id/get-entries", async (req, res) => {
  const userId = req.params.id;
  const entries = await db.getNotebookEntries(userId);
  return res.status(200).json({ entries });
});

app.listen(config.port, () =>
  console.log(`API listening on port ${config.port}`),
);
