//move game collection name to e 

import "./middleware/env-config.js";

import express from "express";
import session from "express-session";
import routes from "./routes/router.js";

import { buildSessionConfig } from "./middleware/session-config.js";
import { dbConnect } from "./middleware/db-config.js";

const app = express();

// Behind nginx: trust its X-Forwarded-Proto so secure session cookies are issued over HTTPS
app.set("trust proxy", 1);

app.use(session(buildSessionConfig()));

//standard public path
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.use(routes);

await dbConnect();
app.listen(process.env.PORT, "127.0.0.1")
