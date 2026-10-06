import React from "react";
import { createRoot } from "react-dom/client";
import Portal from "../components/portal/portal";
import { DeploymentGate } from '../components/portal/access';
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DeploymentGate><Portal /></DeploymentGate>
  </React.StrictMode>,
);
