"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { validateOptimizerInput, validateSolution } = require("../../lib/contracts");
const { runMockOptimizer: runFallbackMockOptimizer } = require("./mock-core");

const PYTHON_SCRIPT = path.resolve(__dirname, "optimizer.py");
const PYTHON_BIN_CANDIDATES = [process.env.PYTHON_BIN, "python3", "python"].filter(Boolean);
const TIMEOUT_MS = parseInt(process.env.OPTIMIZER_TIMEOUT_MS || "15000", 10);

function runWithPythonBin(pythonBin, inputPath, outputPath) {
  execFileSync(pythonBin, [PYTHON_SCRIPT, inputPath, outputPath], {
    timeout: TIMEOUT_MS,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runMockOptimizer(optimizerInput) {
  validateOptimizerInput(optimizerInput);

  if (!fs.existsSync(PYTHON_SCRIPT)) {
    console.warn("[optimizer wrapper] optimizer.py not found — using JS mock fallback.");
    return runFallbackMockOptimizer(optimizerInput);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "optimizer-"));
  const inputFile = path.join(tmpDir, "optimizer_input.json");
  const outputFile = path.join(tmpDir, "solution.json");

  try {
    fs.writeFileSync(inputFile, JSON.stringify(optimizerInput, null, 2), "utf8");

    let lastError = null;
    let executed = false;

    for (const pythonBin of PYTHON_BIN_CANDIDATES) {
      try {
        runWithPythonBin(pythonBin, inputFile, outputFile);
        executed = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!executed) {
      throw lastError || new Error("No Python interpreter available.");
    }

    const raw = fs.readFileSync(outputFile, "utf8");
    const solution = JSON.parse(raw);

    validateSolution(solution);
    return solution;
  } catch (err) {
    console.error("[optimizer wrapper] Python optimizer failed:", err.message || err);
    console.warn("[optimizer wrapper] Falling back to JS mock optimizer.");
    return runFallbackMockOptimizer(optimizerInput);
  } finally {
    for (const f of [inputFile, outputFile]) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (_) {}
    }
    try {
      if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir);
    } catch (_) {}
  }
}

module.exports = { runMockOptimizer };