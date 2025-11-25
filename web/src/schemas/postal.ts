import { z } from "zod";

const PostalEntrySchema = z.object({
	prefectureJa: z.string().min(1),
	cityJa: z.string().min(1),
	townJa: z.string().min(1),
	prefectureEn: z.string().min(1),
	cityEn: z.string().min(1),
	townEn: z.string().min(1),
});

export const PostalPrefixSchema = z.record(z.string().regex(/^\d{7}$/), PostalEntrySchema);

export type PostalEntry = z.infer<typeof PostalEntrySchema>;
export type PostalPrefix = z.infer<typeof PostalPrefixSchema>;
