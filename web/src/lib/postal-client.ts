import { PostalEntry, PostalPrefix, PostalPrefixSchema } from "../schemas/postal";

const cache = new Map<string, PostalPrefix>();
const inflight = new Map<string, Promise<PostalPrefix>>();

const loadPrefix = async (prefix: string): Promise<PostalPrefix> => {
	if (cache.has(prefix)) {
		return cache.get(prefix) as PostalPrefix;
	}
	if (inflight.has(prefix)) {
		return inflight.get(prefix) as Promise<PostalPrefix>;
	}
	const promise = fetch(`/postal/prefix-${prefix}.json`, { cache: "force-cache" })
		.then(async (res) => {
			if (!res.ok) {
				throw new Error("not found");
			}
			const data = await res.json();
			const parsed = PostalPrefixSchema.parse(data);
			cache.set(prefix, parsed);
			inflight.delete(prefix);
			return parsed;
		})
		.catch((error) => {
			inflight.delete(prefix);
			throw error;
		});
	inflight.set(prefix, promise);
	return promise;
};

export const findPostalEntry = async (zip: string): Promise<PostalEntry | undefined> => {
	if (zip.length !== 7) {
		return undefined;
	}
	const prefix = zip.slice(0, 3);
	const map = await loadPrefix(prefix);
	return map[zip];
};
