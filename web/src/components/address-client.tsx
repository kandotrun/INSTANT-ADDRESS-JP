"use client";

import { useMemo, useRef, useState } from "react";
import { composeAddress } from "../lib/compose-address";
import { findPostalEntry } from "../lib/postal-client";
import {
	AddressFormSchema,
	sanitizeBuilding,
	sanitizePhone,
	sanitizeStreet,
	sanitizeZip,
} from "../schemas/form";
import type { PostalEntry } from "../schemas/postal";
import { Input } from "./ui/input";

type Status = "idle" | "loading" | "ready" | "notfound" | "error";
type FieldErrors = Partial<Record<"zip" | "street" | "building" | "phone", string>>;

type FormState = {
	zip: string;
	street: string;
	building: string;
	phone: string;
};

const initialForm: FormState = {
	zip: "",
	street: "",
	building: "",
	phone: "",
};

const buildErrors = (values: FormState): FieldErrors => {
	const result = AddressFormSchema.safeParse(values);
	if (result.success) {
		return {};
	}
	const fieldErrors: FieldErrors = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0];
		if (typeof field === "string" && !fieldErrors[field as keyof FieldErrors]) {
			fieldErrors[field as keyof FieldErrors] = issue.message;
		}
	}
	return fieldErrors;
};

export function AddressClient() {
	const [form, setForm] = useState<FormState>(initialForm);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [entry, setEntry] = useState<PostalEntry | undefined>(undefined);
	const [status, setStatus] = useState<Status>("idle");
	const [toast, setToast] = useState<string>("");
	const latestZip = useRef("");
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastErrorToast = useRef<string>("");

	const copyText = async (value: string, label: string) => {
		if (typeof navigator === "undefined" || !navigator.clipboard) {
			return;
		}
		await navigator.clipboard.writeText(value);
		if (toastTimer.current) {
			clearTimeout(toastTimer.current);
		}
		setToast(`COPIED: ${label}`);
		toastTimer.current = setTimeout(() => {
			setToast("");
		}, 1800);
	};

	const showToast = (message: string) => {
		if (!message || message === toast) {
			return;
		}
		if (toastTimer.current) {
			clearTimeout(toastTimer.current);
		}
		setToast(message);
		toastTimer.current = setTimeout(() => setToast(""), 2200);
	};

	const showValidationToast = (errs: FieldErrors) => {
		const first = errs.zip ?? errs.street ?? errs.building ?? errs.phone;
		if (first && first !== lastErrorToast.current) {
			lastErrorToast.current = first;
			showToast(first);
		}
		if (!first) {
			lastErrorToast.current = "";
		}
	};

	const handleZipChange = async (value: string) => {
		const zip = sanitizeZip(value);
		const nextForm = { ...form, zip };
		setForm(nextForm);
		const nextErrors = buildErrors(nextForm);
		setErrors(nextErrors);
		showValidationToast(nextErrors);
		latestZip.current = zip;
		if (zip.length < 3) {
			setEntry(undefined);
			setStatus("idle");
			return;
		}
		if (zip.length < 7) {
			setEntry(undefined);
			setStatus("idle");
			return;
		}
		setStatus("loading");
		try {
			const result = await findPostalEntry(zip);
			if (latestZip.current !== zip) {
				return;
			}
			if (!result) {
				setEntry(undefined);
				setStatus("notfound");
				showToast("該当の郵便番号が見つかりませんでした");
				return;
			}
			setEntry(result);
			setStatus("ready");
		} catch (error) {
			setEntry(undefined);
			setStatus("error");
			showToast("データ取得に失敗しました");
		}
	};

	const handleStreetChange = (value: string) => {
		const street = sanitizeStreet(value);
		const nextForm = { ...form, street };
		setForm(nextForm);
		const nextErrors = buildErrors(nextForm);
		setErrors(nextErrors);
		showValidationToast(nextErrors);
	};

	const handleBuildingChange = (value: string) => {
		const building = sanitizeBuilding(value);
		const nextForm = { ...form, building };
		setForm(nextForm);
		const nextErrors = buildErrors(nextForm);
		setErrors(nextErrors);
		showValidationToast(nextErrors);
	};

	const handlePhoneChange = (value: string) => {
		const phone = sanitizePhone(value);
		const nextForm = { ...form, phone };
		setForm(nextForm);
		const nextErrors = buildErrors(nextForm);
		setErrors(nextErrors);
		showValidationToast(nextErrors);
	};

	const composed = useMemo(() => {
		if (!entry) {
			return undefined;
		}
		return composeAddress(form.zip, entry, form.street, form.building, form.phone);
	}, [entry, form.building, form.phone, form.street, form.zip]);

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<section className="panel" style={{ display: "grid", gap: 12 }}>
				<div className="row-split">
					<div className="mono-block">入力</div>
				</div>
				<div className="grid-two">
					<div className="surface" style={{ display: "grid", gap: 6 }}>
						<label htmlFor="zip">郵便番号</label>
						<Input
							id="zip"
							name="zip"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={8}
							value={form.zip}
							onChange={(e) => handleZipChange(e.target.value)}
							placeholder="1008111"
						/>
					{status === "loading" ? <span className="muted">読み込み中...</span> : null}
					</div>
					<div className="surface" style={{ display: "grid", gap: 6 }}>
						<label htmlFor="street">番地</label>
						<Input
							id="street"
							name="street"
							maxLength={100}
							value={form.street}
							onChange={(e) => handleStreetChange(e.target.value)}
							placeholder="1-1"
						/>
						{errors.street ? <span className="alert">{errors.street}</span> : null}
					</div>
				</div>
				<div className="surface" style={{ display: "grid", gap: 6 }}>
					<label htmlFor="building">建物名・部屋番号</label>
					<Input
						id="building"
						name="building"
						maxLength={100}
						value={form.building}
						onChange={(e) => handleBuildingChange(e.target.value)}
						placeholder="IMPERIAL PALACE"
					/>
					{errors.building ? <span className="alert">{errors.building}</span> : null}
				</div>
				<div className="surface" style={{ display: "grid", gap: 6 }}>
					<label htmlFor="phone">電話番号（任意）</label>
					<Input
						id="phone"
						name="phone"
						inputMode="tel"
						pattern="[0-9]*"
						maxLength={13}
						value={form.phone}
						onChange={(e) => handlePhoneChange(e.target.value)}
						placeholder="0332112111"
					/>
					{errors.phone ? <span className="alert">{errors.phone}</span> : null}
				</div>
			</section>

			<section className="panel" style={{ gap: 10 }}>
				<div className="mono-block">英語住所</div>
				<div className="result-block">
					<div className="result-row-stack">
						<span className="copy-head">SINGLE LINE</span>
						<span>{composed ? composed.singleLine : "-"}</span>
						{composed ? (
							<button
								className="button-ghost"
								onClick={() => copyText(composed.singleLine, "SINGLE LINE")}
							>
								COPY
							</button>
						) : null}
					</div>
				</div>
				<div className="copy-grid">
					{composed ? (
						<>
							<div className="copy-cell">
								<span className="copy-head">LINE1</span>
								<span>{composed.line1}</span>
								<button className="button-ghost" onClick={() => copyText(composed.line1, "LINE1")}>
									COPY
								</button>
							</div>
							<div className="copy-cell">
								<span className="copy-head">LINE2</span>
								<span>{composed.line2}</span>
								<button className="button-ghost" onClick={() => copyText(composed.line2, "LINE2")}>
									COPY
								</button>
							</div>
							<div className="copy-cell">
								<span className="copy-head">CITY</span>
								<span>{composed.city}</span>
								<button className="button-ghost" onClick={() => copyText(composed.city, "CITY")}>
									COPY
								</button>
							</div>
							<div className="copy-cell">
								<span className="copy-head">STATE</span>
								<span>{composed.state}</span>
								<button className="button-ghost" onClick={() => copyText(composed.state, "STATE")}>
									COPY
								</button>
							</div>
							<div className="copy-cell">
								<span className="copy-head">ZIP</span>
								<span>{composed.zip}</span>
								<button className="button-ghost" onClick={() => copyText(composed.zip, "ZIP")}>
									COPY
								</button>
							</div>
							<div className="copy-cell">
								<span className="copy-head">COUNTRY</span>
								<span>{composed.country}</span>
								<button className="button-ghost" onClick={() => copyText(composed.country, "COUNTRY")}>
									COPY
								</button>
							</div>
							{composed.phoneIntl ? (
								<div className="copy-cell">
									<span className="copy-head">PHONE</span>
									<span>{composed.phoneIntl}</span>
									<button className="button-ghost" onClick={() => copyText(composed.phoneIntl as string, "PHONE")}>
										COPY
									</button>
								</div>
							) : null}
						</>
					) : (
						<div className="copy-cell">
							<span className="copy-head">STATUS</span>
							<span>入力を開始してください</span>
						</div>
					)}
				</div>
			</section>

			<section className="panel" style={{ gap: 10 }}>
				<div className="mono-block">日本語住所</div>
				<div className="result-row">
					<span>PREF</span>
					<span>{entry ? entry.prefectureJa : "-"}</span>
				</div>
				<div className="result-row">
					<span>CITY</span>
					<span>{entry ? entry.cityJa : "-"}</span>
				</div>
				<div className="result-row">
					<span>TOWN</span>
					<span>{entry ? entry.townJa : "-"}</span>
				</div>
			</section>

			{toast ? <div className="toast">{toast}</div> : null}
		</div>
	);
}
