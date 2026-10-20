import "../theme/preview.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { KitPreview } from "./KitPreview";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <KitPreview />
    </StrictMode>,
  );
}
