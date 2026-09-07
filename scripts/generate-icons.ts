import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { transform } from "@svgr/core";
import jsx from "@svgr/plugin-jsx";
import svgo from "@svgr/plugin-svgo";

const ICONS_SRC_DIR = path.resolve(import.meta.dirname, "../src/assets/icons");
const ICONS_OUT_DIR = path.resolve(
  import.meta.dirname,
  "../src/components/ui/icons",
);

function toPascalCase(kebabCase: string): string {
  return kebabCase
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

async function generateIcon(fileName: string): Promise<string> {
  const svgCode = readFileSync(path.join(ICONS_SRC_DIR, fileName), "utf-8");
  const baseName = fileName.replace(/\.svg$/, "");
  const componentName = `${toPascalCase(baseName)}Icon`;

  const tsxCode = await transform(
    svgCode,
    {
      typescript: true,
      exportType: "named",
      namedExport: componentName,
      jsxRuntime: "automatic",
      plugins: [svgo, jsx],
      svgoConfig: {
        plugins: [
          {
            name: "preset-default",
            // viewBox를 지우면 size-* 유틸리티로 크기를 바꿀 때 내부 좌표계가 안 늘어나고
            // 잘려 보인다 — width/height와 viewBox가 같아도 유지해야 한다.
            params: { overrides: { removeViewBox: false } },
          },
        ],
      },
    },
    { componentName },
  );

  writeFileSync(path.join(ICONS_OUT_DIR, `${componentName}.tsx`), tsxCode);
  return componentName;
}

async function main() {
  mkdirSync(ICONS_OUT_DIR, { recursive: true });
  const files = readdirSync(ICONS_SRC_DIR).filter((file) =>
    file.endsWith(".svg"),
  );

  const componentNames: string[] = [];
  for (const file of files) {
    componentNames.push(await generateIcon(file));
  }
  componentNames.sort();

  const indexCode =
    componentNames
      .map((name) => `export { ${name} } from "./${name}";`)
      .join("\n") + "\n";
  writeFileSync(path.join(ICONS_OUT_DIR, "index.ts"), indexCode);

  // SVGR 출력은 한 줄짜리 압축 코드라 프로젝트 포맷(Prettier)에 맞춘다.
  execFileSync("npx", [
    "prettier",
    "--write",
    path.join(ICONS_OUT_DIR, "*.{ts,tsx}"),
  ]);

  console.log(
    `${componentNames.length}개 아이콘을 생성했습니다 → ${path.relative(process.cwd(), ICONS_OUT_DIR)}`,
  );
}

main();
