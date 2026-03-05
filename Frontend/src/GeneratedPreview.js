// src/GeneratedPreview.js
import React from "react";
import * as Babel from "@babel/standalone";
import { muiCore, muiIcons, muiStyles } from "./componentRegistry";

/* -----------------------------------------
   ERROR BOUNDARY TO CATCH RENDER-TIME CRASHES
----------------------------------------- */
class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.toString() };
  }

  componentDidCatch(error) {
    this.setState({ hasError: true, error: error.toString() });
  }

  render() {
    if (this.state.hasError) {
      return (
        <pre style={{ color: "red", padding: 10, whiteSpace: "pre-wrap" }}>
          <b>⛔ COMPONENT RENDER ERROR</b>
          {"\n"}
          {this.state.error}
        </pre>
      );
    }
    return this.props.children;
  }
}

/* -----------------------------------------
   LLM CODE CLEANER
----------------------------------------- */
function extractCodeFromLLM(text) {
  if (!text) return "";
  const fenceMatch = text.match(/```(?:jsx?|tsx)?\s*([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  return text.trim();
}

function stripImportsAndExports(code) {
  let out = code;

  // Remove import lines
  out = out.replace(/^\s*import[\s\S]*?;\s*$/gm, "");

  // export default function Foo() {}  ->  function Foo() {}
  out = out.replace(
    /export\s+default\s+function\s+([A-Za-z0-9_]+)/g,
    "function $1"
  );

  // export default Foo;  ->  (remove)
  out = out.replace(/^\s*export\s+default\s+([A-Za-z0-9_]+)\s*;?\s*$/gm, "");

  // export { Foo, Bar };  ->  (remove)
  out = out.replace(/^\s*export\s+\{[\s\S]*?\}\s*;?\s*$/gm, "");

  return out.trim();
}

/* -----------------------------------------
   AUTO-BIND MUI COMPONENTS / ICONS / STYLES
----------------------------------------- */
function buildMuiBindings(code) {
  const lines = [];

  // Names available on each namespace
  const coreKeys = new Set(Object.keys(muiCore || {}));
  const iconKeys = new Set(Object.keys(muiIcons || {}));
  const styleKeys = new Set(Object.keys(muiStyles || {}));

  // 1) Find JSX tag names, e.g. <AppBar>, </Toolbar>, <LockOutlinedIcon />
  const jsxTagRegex = /<\/?\s*([A-Z][A-Za-z0-9_]*)\b/g;
  const jsxNames = new Set();

  let match;
  while ((match = jsxTagRegex.exec(code)) !== null) {
    jsxNames.add(match[1]);
  }

  // 2) Auto-bind any JSX tag that matches a MUI core component or icon
  jsxNames.forEach((name) => {
    if (coreKeys.has(name)) {
      lines.push(`const ${name} = muiCore.${name};`);
    } else if (iconKeys.has(name)) {
      lines.push(`const ${name} = muiIcons.${name};`);
    }
  });

  // 3) Common style/theming helpers that are not JSX tags
  const styleCandidates = [
    "makeStyles",
    "withStyles",
    "createStyles",
    "useTheme",
    "ThemeProvider",
    "createMuiTheme",
    "createTheme",
  ];

  styleCandidates.forEach((name) => {
    if (code.includes(name) && styleKeys.has(name)) {
      lines.push(`const ${name} = muiStyles.${name};`);
    }
  });

  return lines.join("\n");
}

/* -----------------------------------------
   WRAPPER THAT INJECTS MUI + ICONS
----------------------------------------- */
function buildWrappedSource(raw) {
  const cleaned = extractCodeFromLLM(raw);

  // Figure out the component's name from export default
  const defaultFuncMatch = cleaned.match(
    /export\s+default\s+function\s+([A-Za-z0-9_]+)/
  );
  const defaultNameMatch = cleaned.match(
    /export\s+default\s+([A-Za-z0-9_]+)\s*;/
  );

  let componentName = "GeneratedComponent";
  if (defaultFuncMatch) componentName = defaultFuncMatch[1];
  else if (defaultNameMatch) componentName = defaultNameMatch[1];

  // Remove imports/exports so we can eval the body directly
  const body = stripImportsAndExports(cleaned);

  // 🔥 Auto-generate all the `const X = muiCore.X` / `const Y = muiIcons.Y` / etc.
  const bindingLines = buildMuiBindings(body);

  const prelude = `
    ${bindingLines}
  `;

  // Wrap in an IIFE that receives (React, muiCore, muiIcons, muiStyles)
  return `
    (function(React, muiCore, muiIcons, muiStyles) {
      try {
        ${prelude}
        ${body}
        return typeof ${componentName} !== "undefined" ? ${componentName} : null;
      } catch (err) {
        throw new Error("Execution error: " + err.message);
      }
    })
  `;
}

/* -----------------------------------------
   MAIN COMPONENT (FULLY ERROR BOUNDED)
----------------------------------------- */
export default function GeneratedPreview({ code }) {
  if (!code) return null;

  try {
    const wrappedSource = buildWrappedSource(code);

    const { code: transformed } = Babel.transform(wrappedSource, {
      presets: ["react"],
      filename: "GeneratedComponent.jsx",
    });

    // Eval inside try/catch to catch syntax errors
    let factory;
    try {
      // eslint-disable-next-line no-eval
      factory = eval(transformed);
    } catch (e) {
      return (
        <pre style={{ color: "red", padding: 10, whiteSpace: "pre-wrap" }}>
          <b>⛔ SYNTAX ERROR WHILE COMPILING JSX</b>
          {"\n"}
          {e.message}
        </pre>
      );
    }

    let Comp;
    try {
      Comp = factory(React, muiCore, muiIcons, muiStyles);
    } catch (e) {
      return (
        <pre style={{ color: "red", padding: 10, whiteSpace: "pre-wrap" }}>
          <b>⛔ EXECUTION ERROR</b>
          {"\n"}
          {e.message}
        </pre>
      );
    }

    if (!Comp) {
      return (
        <pre style={{ color: "red", padding: 10, whiteSpace: "pre-wrap" }}>
          <b>No component found.</b>
          {"\n"}Make sure there is a default export (e.g. `export default
          MyComponent;`).
        </pre>
      );
    }

    // FINAL: render inside error boundary to catch runtime crashes
    return (
      <SafeBoundary>
        <Comp />
      </SafeBoundary>
    );
  } catch (err) {
    return (
      <pre style={{ color: "red", padding: 10, whiteSpace: "pre-wrap" }}>
        <b>⛔ UNEXPECTED ERROR</b>
        {"\n"}
        {err.message}
      </pre>
    );
  }
}
