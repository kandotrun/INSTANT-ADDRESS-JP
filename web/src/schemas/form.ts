import { z } from "zod";

export const sanitizeZip = (value: string): string => value.replace(/\D/g, "").slice(0, 7);
export const sanitizeStreet = (value: string): string => value.trim().slice(0, 100).toUpperCase();
export const sanitizeBuilding = (value: string): string => value.trim().slice(0, 100);
export const sanitizePhone = (value: string): string => value.replace(/\D/g, "").slice(0, 11);

export const AddressFormSchema = z.object({
	zip: z
		.string()
		.transform(sanitizeZip)
		.refine((v) => v.length >= 3, "郵便番号は3桁以上入力してください")
		.refine((v) => v.length === 7, "郵便番号は7桁で入力してください"),
	street: z.string().max(100).transform(sanitizeStreet),
	building: z.string().max(100).transform(sanitizeBuilding),
	phone: z
		.string()
		.transform(sanitizePhone)
		.refine(
			(v) => v.length === 0 || (v.length >= 8 && v.length <= 11),
			"電話番号は8〜11桁で入力してください",
		),
});

type AddressFormValues = z.infer<typeof AddressFormSchema>;
