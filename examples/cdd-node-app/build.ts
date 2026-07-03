import { build } from "bun";

const buildApp = async () => {
  const result = await build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    target: "bun",
    format: "esm",
  });

  if (!result.success) {
    const errorMessages = result.logs.map((log) => log.message || log).join("\n");
    throw new Error(`Build failed:\n${errorMessages}`);
  }

  return result;
};

const runBuild = async () => {
  console.log("Starting build process...");
  try {
    await Promise.all([
      buildApp(),
      // Các tác vụ build khác có thể thêm vào đây để chạy song song
    ]);
    console.log("Build successful! Output written to ./dist");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runBuild();
