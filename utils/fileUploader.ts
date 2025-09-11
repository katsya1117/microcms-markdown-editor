import cuid from "cuid";

// R2 に許可する拡張子
const allowExts = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];

// ファイル名から拡張子を取得
function getExt(filename: string) {
  const pos = filename.lastIndexOf(".");
  if (pos === -1) return "";
  return filename.slice(pos + 1).toLowerCase();
}

// 拡張子チェック
function checkExt(filename: string) {
  const ext = getExt(filename);
  return allowExts.includes(ext);
}

// === ここがメイン ===
// ファイルをアップロードして公開URLを返す
export async function fileUploader(file: File): Promise<string> {
  // 拡張子チェック
  if (!checkExt(file.name)) {
    throw new Error("アップロードできないファイル形式です");
  }

  // 安全なファイル名を生成
  const ext = getExt(file.name);
  const fileName = `${cuid()}.${ext}`;

  // 1) APIから署名URLを取得（dir は送らない）
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName,
      contentType: file.type || `image/${ext}`,
    }),
  });

  if (!res.ok) {
    throw new Error("署名URLの取得に失敗しました");
  }

  const { signedUrl, publicUrl } = await res.json();

  // 2) 署名付きURLへ直接PUT
  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || `image/${ext}` },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error("R2へのアップロードに失敗しました");
  }

  // 3) 公開URLを返す
  return publicUrl;
}