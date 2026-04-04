"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const CLI_PATH = path.join(ROOT_DIR, "src", "cli", "index.js");
const PIPELINE_DIR = path.join(ROOT_DIR, "pipeline");
const FRONTEND_PUBLIC_DIR = path.join(ROOT_DIR, "src", "viewer", "frontend", "public");
const OUTPUT_DIR = path.join(FRONTEND_PUBLIC_DIR, "generated");
const SCENARIOS = ["normal", "demand_spike", "blocked_route"];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(sourcePath, targetPath) {
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function runScenario(scenario) {
  execFileSync("node", [CLI_PATH, "run", scenario], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });
}

function exportScenarioArtifacts(scenario) {
  const scenarioDir = path.join(OUTPUT_DIR, scenario);
  ensureDir(scenarioDir);

  copyFile(
    path.join(ROOT_DIR, "scenarios", scenario, "world_state.json"),
    path.join(scenarioDir, "world_state.json")
  );
  copyFile(
    path.join(PIPELINE_DIR, "ai_output", "ai_analysis.json"),
    path.join(scenarioDir, "ai_analysis.json")
  );
  copyFile(
    path.join(PIPELINE_DIR, "solution", "solution.json"),
    path.join(scenarioDir, "solution.json")
  );
}

function writeManifest() {
  const manifest = {
    generated_at: new Date().toISOString(),
    scenarios: SCENARIOS,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
}

function main() {
  ensureDir(OUTPUT_DIR);

  for (const scenario of SCENARIOS) {
    runScenario(scenario);
    exportScenarioArtifacts(scenario);
  }

  writeManifest();
  console.log(`Viewer data generated in ${OUTPUT_DIR}`);
}

main();
