import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { z } from "zod";

const JA_URL = "https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip";
const ROME_URL = "https://www.post.japanpost.jp/zipcode/dl/roman/KEN_ALL_ROME.zip";
const repoRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const OUTPUT_DIR = join(repoRoot, "public", "postal");

type JaRecord = {
	prefectureJa: string;
	cityJa: string;
	townJa: string;
};

type RomeRecord = {
	prefectureEn: string;
	cityEn: string;
	townEn: string;
};

const PostalEntrySchema = z.object({
	prefectureJa: z.string().min(1),
	cityJa: z.string().min(1),
	townJa: z.string().min(1),
	prefectureEn: z.string().min(1),
	cityEn: z.string().min(1),
	townEn: z.string().min(1),
});

type PostalEntry = z.infer<typeof PostalEntrySchema>;

const normalize = (value: string): string => value.trim().replace(/\s+/g, " ").toUpperCase();

const downloadZip = async (url: string): Promise<Buffer> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`failed to download ${url}: ${response.status}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
};

const extractCsv = (zipBuffer: Buffer): string => {
	const zip = new AdmZip(zipBuffer);
	const entry = zip.getEntries().find((item) => item.entryName.toLowerCase().endsWith(".csv"));
	if (!entry) {
		throw new Error("csv not found in archive");
	}
	const raw = entry.getData();
	return iconv.decode(raw, "shift_jis");
};

const loadJaMap = (csvText: string): Record<string, JaRecord> => {
	const rows = parse(csvText, { relaxColumnCount: true }) as string[][];
	const result: Record<string, JaRecord> = {};
	for (const row of rows) {
		if (row.length < 9) {
			continue;
		}
		const zip = row[2]?.trim();
		const prefectureJa = row[6]?.trim();
		const cityJa = row[7]?.trim();
		const townJa = row[8]?.trim();
		if (!zip || !prefectureJa || !cityJa || !townJa) {
			continue;
		}
		if (!result[zip]) {
			result[zip] = { prefectureJa, cityJa, townJa };
		}
	}
	return result;
};

const loadRomeMap = (csvText: string): Record<string, RomeRecord> => {
	const rows = parse(csvText, { relaxColumnCount: true }) as string[][];
	const result: Record<string, RomeRecord> = {};
	for (const row of rows) {
		if (row.length < 7) {
			continue;
		}
		const zip = row[0]?.trim();
		const prefectureEn = row[4]?.trim();
		const cityEn = row[5]?.trim();
		const townEn = row[6]?.trim();
		if (!zip || !prefectureEn || !cityEn || !townEn) {
			continue;
		}
		result[zip] = {
			prefectureEn: normalize(prefectureEn),
			cityEn: normalize(cityEn),
			townEn: normalize(townEn),
		};
	}
	return result;
};

const mergeMaps = (
	jaMap: Record<string, JaRecord>,
	romeMap: Record<string, RomeRecord>,
): Record<string, PostalEntry> => {
	const zips = new Set([...Object.keys(jaMap), ...Object.keys(romeMap)]);
	const merged: Record<string, PostalEntry> = {};
	for (const zip of zips) {
		const ja = jaMap[zip];
		const en = romeMap[zip];
		if (!ja || !en) {
			continue;
		}
		const candidate = {
			...ja,
			...en,
		};
		const parsed = PostalEntrySchema.safeParse(candidate);
		if (!parsed.success) {
			console.warn(`skip invalid entry: ${zip}`);
			continue;
		}
		merged[zip] = parsed.data;
	}
	return merged;
};

const bucketByPrefix = (
	entries: Record<string, PostalEntry>,
): Record<string, Record<string, PostalEntry>> => {
	const buckets: Record<string, Record<string, PostalEntry>> = {};
	for (const [zip, entry] of Object.entries(entries)) {
		if (zip.length < 3) {
			continue;
		}
		const prefix = zip.slice(0, 3);
		if (!buckets[prefix]) {
			buckets[prefix] = {};
		}
		buckets[prefix][zip] = entry;
	}
	return buckets;
};

const writeBuckets = async (
	buckets: Record<string, Record<string, PostalEntry>>,
): Promise<void> => {
	await mkdir(OUTPUT_DIR, { recursive: true });
	const prefixes = Object.keys(buckets).sort();
	for (const prefix of prefixes) {
		const bucket = buckets[prefix];
		const sorted = Object.keys(bucket)
			.sort()
			.reduce<Record<string, PostalEntry>>((acc, zip) => {
				acc[zip] = bucket[zip];
				return acc;
			}, {});
		const target = join(OUTPUT_DIR, `prefix-${prefix}.json`);
		const payload = JSON.stringify(sorted);
		await writeFile(target, payload);
	}
};

const main = async (): Promise<void> => {
	const [jaZip, romeZip] = await Promise.all([downloadZip(JA_URL), downloadZip(ROME_URL)]);
	const jaCsv = extractCsv(jaZip);
	const romeCsv = extractCsv(romeZip);
	const jaMap = loadJaMap(jaCsv);
	const romeMap = loadRomeMap(romeCsv);
	const merged = mergeMaps(jaMap, romeMap);
	const buckets = bucketByPrefix(merged);
	await writeBuckets(buckets);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
