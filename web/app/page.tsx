import Link from "next/link";
import { AddressClient } from "../src/components/address-client";

export default function Page() {
	return (
		<main>
			<header>
				<div className="container row-split">
					<h1>INSTANT ADDRESS JP</h1>
				</div>
			</header>
			<div className="container" style={{ display: "grid", gap: 16 }}>
				<AddressClient />
				<section className="panel" style={{ display: "grid", gap: 10 }}>
					<div className="row-split">
						<div className="mono-block">APIの使い方</div>
						<Link className="button-ghost" href="https://github.com/kandotrun/INSTANT-ADDRESS-JP" target="_blank" rel="noreferrer">
							GitHubで見る
						</Link>
					</div>
					<ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.6 }}>
						<li>エンドポイント: <code>/postal/prefix-&#123;PPP&#125;.json</code>（PPP は郵便番号先頭3桁）</li>
						<li>レスポンス: キーが郵便番号7桁のオブジェクト（値は都道府県/市区町村/町名の日本語・英語）</li>
						<li>使い方: 先頭3桁で取得し、返却オブジェクトから対象の7桁キーを参照</li>
					</ul>
					<div style={{ fontSize: 12, color: "#6b7280" }}>
						curl 例: <code>curl -s https://&lt;host&gt;/postal/prefix-100.json | jq ' ."1008111" '</code>
					</div>
				</section>
			</div>
		</main>
	);
}
