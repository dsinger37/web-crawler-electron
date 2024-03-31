import { createRoot } from "react-dom/client";
import { About } from "./About";

const aboutRoot = document.getElementById("aboutWindowRoot");
const root = createRoot(aboutRoot);
root.render(<About />);
