const path = require("path");
const { readJson, writeJson, copyFile, ensureDir, fileExists } = require("../lib/json");
const {
  validateAiAnalysis,
  validateOptimizerInput,
  validateSolution,
  validateWorldState
} = require("../lib/contracts");
const { runMockAi } = require("../modules/ai/mock-ai");
const { buildOptimizerInput } = require("../orchestrator/build-optimizer-input");
const { runMockOptimizer } = require("../modules/optimizer/mock-optimizer");
const { renderSummary } = require("../viewer/render-summary");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PIPELINE_DIR = path.join(ROOT_DIR, "pipeline");

function getScenarioPath(name) {
  return path.join(ROOT_DIR, "scenarios", name, "world_state.json");
}

function getPipelinePaths() {
  return {
    worldStatePath: path.join(PIPELINE_DIR, "input", "world_state.json"),
    aiAnalysisPath: path.join(PIPELINE_DIR, "ai_output", "ai_analysis.json"),
    optimizerInputPath: path.join(PIPELINE_DIR, "optimizer_input", "optimizer_input.json"),
    solutionPath: path.join(PIPELINE_DIR, "solution", "solution.json")
  };
}

function listScenarios() {
  return ["normal", "demand_spike", "blocked_route"];
}

function loadWorldState(worldStatePath) {
  const data = readJson(worldStatePath);
  validateWorldState(data);
  return data;
}

function runAiCommand(worldStatePath, outputPath) {
  const worldState = loadWorldState(worldStatePath);
  const aiAnalysis = runMockAi(worldState);
  validateAiAnalysis(aiAnalysis);
  writeJson(outputPath, aiAnalysis);
  return aiAnalysis;
}

function runPrepareCommand(worldStatePath, aiPath, outputPath) {
  const worldState = loadWorldState(worldStatePath);
  const aiAnalysis = readJson(aiPath);
  validateAiAnalysis(aiAnalysis);
  const optimizerInput = buildOptimizerInput(worldState, aiAnalysis);
  validateOptimizerInput(optimizerInput);
  writeJson(outputPath, optimizerInput);
  return optimizerInput;
}

function runOptimizeCommand(optimizerInputPath, outputPath) {
  const optimizerInput = readJson(optimizerInputPath);
  validateOptimizerInput(optimizerInput);
  const solution = runMockOptimizer(optimizerInput);
  validateSolution(solution);
  writeJson(outputPath, solution);
  return solution;
}

function runViewCommand(worldStatePath, solutionPath, aiPath, optimizerInputPath = "N/A") {
  const worldState = loadWorldState(worldStatePath);
  const solution = readJson(solutionPath);
  const aiAnalysis = readJson(aiPath);
  validateSolution(solution);
  validateAiAnalysis(aiAnalysis);
  console.log(
    renderSummary(worldState, solution, aiAnalysis, {
      worldStatePath,
      aiAnalysisPath: aiPath,
      optimizerInputPath,
      solutionPath
    })
  );
}

function runScenarioCommand(scenarioName) {
  const worldStateScenarioPath = getScenarioPath(scenarioName);
  if (!fileExists(worldStateScenarioPath)) {
    throw new Error(`Unknown scenario "${scenarioName}". Run "list-scenarios" first.`);
  }

  const paths = getPipelinePaths();
  ensureDir(path.dirname(paths.worldStatePath));
  ensureDir(path.dirname(paths.aiAnalysisPath));
  ensureDir(path.dirname(paths.optimizerInputPath));
  ensureDir(path.dirname(paths.solutionPath));

  copyFile(worldStateScenarioPath, paths.worldStatePath);
  runAiCommand(paths.worldStatePath, paths.aiAnalysisPath);
  runPrepareCommand(paths.worldStatePath, paths.aiAnalysisPath, paths.optimizerInputPath);
  runOptimizeCommand(paths.optimizerInputPath, paths.solutionPath);
  runViewCommand(paths.worldStatePath, paths.solutionPath, paths.aiAnalysisPath, paths.optimizerInputPath);
}

function runVerifyCommand() {
  for (const scenarioName of listScenarios()) {
    const worldStatePath = getScenarioPath(scenarioName);
    const worldState = loadWorldState(worldStatePath);
    const aiAnalysis = runMockAi(worldState);
    const optimizerInput = buildOptimizerInput(worldState, aiAnalysis);
    const solution = runMockOptimizer(optimizerInput);

    validateAiAnalysis(aiAnalysis);
    validateOptimizerInput(optimizerInput);
    validateSolution(solution);

    if (!aiAnalysis.summary || aiAnalysis.recommendations.length === 0) {
      throw new Error(`AI output for ${scenarioName} is incomplete.`);
    }

    if (
      !solution.kpis ||
      !Array.isArray(solution.allocation_plan) ||
      !Array.isArray(solution.alerts) ||
      !Array.isArray(solution.explanation)
    ) {
      throw new Error(`Solution output for ${scenarioName} is incomplete.`);
    }
  }

  console.log("Verification passed for all scenarios.");
}

function printHelp() {
  console.log(`Usage:
  node src/cli/index.js list-scenarios
  node src/cli/index.js run <scenario>
  node src/cli/index.js ai <world_state_path> <output_path>
  node src/cli/index.js prepare <world_state_path> <ai_analysis_path> <output_path>
  node src/cli/index.js optimize <optimizer_input_path> <output_path>
  node src/cli/index.js view <world_state_path> <solution_path> <ai_analysis_path> [optimizer_input_path]
  node src/cli/index.js verify`);
}

function main() {
  const [, , command, ...args] = process.argv;

  try {
    switch (command) {
      case "list-scenarios":
        console.log(listScenarios().join("\n"));
        break;
      case "run":
        if (!args[0]) {
          throw new Error("Scenario name is required.");
        }
        runScenarioCommand(args[0]);
        break;
      case "ai":
        if (args.length < 2) {
          throw new Error("Usage: ai <world_state_path> <output_path>");
        }
        runAiCommand(path.resolve(ROOT_DIR, args[0]), path.resolve(ROOT_DIR, args[1]));
        console.log(`AI analysis written to ${path.resolve(ROOT_DIR, args[1])}`);
        break;
      case "prepare":
        if (args.length < 3) {
          throw new Error("Usage: prepare <world_state_path> <ai_analysis_path> <output_path>");
        }
        runPrepareCommand(
          path.resolve(ROOT_DIR, args[0]),
          path.resolve(ROOT_DIR, args[1]),
          path.resolve(ROOT_DIR, args[2])
        );
        console.log(`Optimizer input written to ${path.resolve(ROOT_DIR, args[2])}`);
        break;
      case "optimize":
        if (args.length < 2) {
          throw new Error("Usage: optimize <optimizer_input_path> <output_path>");
        }
        runOptimizeCommand(path.resolve(ROOT_DIR, args[0]), path.resolve(ROOT_DIR, args[1]));
        console.log(`Solution written to ${path.resolve(ROOT_DIR, args[1])}`);
        break;
      case "view":
        if (args.length < 3) {
          throw new Error("Usage: view <world_state_path> <solution_path> <ai_analysis_path> [optimizer_input_path]");
        }
        runViewCommand(
          path.resolve(ROOT_DIR, args[0]),
          path.resolve(ROOT_DIR, args[1]),
          path.resolve(ROOT_DIR, args[2]),
          args[3] ? path.resolve(ROOT_DIR, args[3]) : "N/A"
        );
        break;
      case "verify":
        runVerifyCommand();
        break;
      default:
        printHelp();
        if (command) {
          process.exitCode = 1;
        }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
