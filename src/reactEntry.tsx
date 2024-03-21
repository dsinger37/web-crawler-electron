import { createRoot } from "react-dom/client";
import { App } from "./App";

const reactRoot = document.getElementById("app");
const root = createRoot(reactRoot);
root.render(<App />);
