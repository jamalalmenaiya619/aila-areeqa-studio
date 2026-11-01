import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/studybook.generated.css";
import "./styles/intel.generated.css";
import "./styles/app.css";
import App from "./App";
import { applyTheme, readTheme } from "./lib/theme";

applyTheme(readTheme());
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
