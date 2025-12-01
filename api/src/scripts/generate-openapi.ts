/// <reference types="node" />

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import openApiDocument from "../openapi/spec";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "../..", "openapi.yaml");

const yaml = stringify(openApiDocument, { sortMapEntries: true });
const header =
	"# THIS FILE IS GENERATED FROM src/openapi/spec.ts. DO NOT EDIT DIRECTLY.\n";

writeFileSync(outputPath, `${header}${yaml}`);
console.log(`✅ OpenAPI spec generated: ${outputPath}`);
