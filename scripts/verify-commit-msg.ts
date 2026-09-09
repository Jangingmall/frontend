import { readFileSync } from "node:fs";

const COMMIT_TYPES = [
  "feat",
  "fix",
  "style",
  "refactor",
  "chore",
  "docs",
  "test",
];
const MAX_HEADER_LENGTH = 50;

function fail(reason: string): never {
  console.error(`✖ 커밋 메시지 규칙 위반: ${reason}`);
  console.error(
    '  형식: "type: subject" — 헤더 한 줄만, 마침표 없이, 50자 이내',
  );
  console.error(`  type: ${COMMIT_TYPES.join(", ")}`);
  console.error("  참고: docs/git-convention.md 3장");
  process.exit(1);
}

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  fail("commit message 파일 경로를 전달받지 못했습니다.");
}

const raw = readFileSync(commitMsgFile, "utf-8");
const lines = raw.split("\n").filter((line) => !line.startsWith("#"));
while (lines.length > 0 && lines.at(-1)?.trim() === "") {
  lines.pop();
}

if (lines.length === 0) {
  fail("커밋 메시지가 비어 있습니다.");
}
if (lines.length > 1) {
  fail("헤더 한 줄만 작성해야 합니다(본문·트레일러 없이).");
}

const header = lines[0];

if (header.length > MAX_HEADER_LENGTH) {
  fail(`${MAX_HEADER_LENGTH}자를 넘었습니다(현재 ${header.length}자).`);
}
if (header.endsWith(".")) {
  fail("마침표로 끝내지 않습니다.");
}
if (!new RegExp(`^(${COMMIT_TYPES.join("|")}): .+`).test(header)) {
  fail(`"type: subject" 형식이 아닙니다: "${header}"`);
}
