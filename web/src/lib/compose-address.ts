import { PostalEntry } from "../schemas/postal";

type ComposedAddress = {
	singleLine: string;
	line1: string;
	line2: string;
	city: string;
	state: string;
	zip: string;
	country: string;
	phoneIntl?: string;
};

const formatZip = (zip: string): string => {
	if (zip.length === 7) {
		return `${zip.slice(0, 3)}-${zip.slice(3)}`;
	}
	return zip;
};

const formatPhoneIntl = (phone: string): string | undefined => {
	if (!phone) {
		return undefined;
	}
	const digits = phone.replace(/\D/g, "");
	if (digits.startsWith("0")) {
		return `+81-${digits.slice(1)}`;
	}
	return `+81-${digits}`;
};

export const composeAddress = (
	zip: string,
	entry: PostalEntry,
	street: string,
	building: string,
	phone: string,
): ComposedAddress => {
	const clean = (value: string) => value.replace(/\s+/g, " ").trim();
	const hyphenate = (value: string) => value.replace(/\s+/g, "-").trim();
	const town = clean(entry.townEn);
	const city = clean(entry.cityEn);
	const state = clean(entry.prefectureEn);
	const streetNormalized = street.length > 0 ? hyphenate(street) : "";
	const line1Base = [streetNormalized, town].filter((v) => v.length > 0).join(" ");
	const line1 = [line1Base, building].filter((v) => v.length > 0).join(" ");
	const line2 = `${city}, ${state}`;
	const zipFormatted = formatZip(zip);
	const phoneIntl = formatPhoneIntl(phone);
	const parts = [line1, line2, zipFormatted, "JAPAN"];
	const singleLine = parts.filter((part) => part.length > 0).join(", ");
	return {
		singleLine,
		line1,
		line2,
		city,
		state,
		zip: zipFormatted,
		country: "JAPAN",
		phoneIntl,
	};
};
