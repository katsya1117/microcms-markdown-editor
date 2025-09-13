import { useFieldExtension } from "microcms-field-extension-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { visit } from "unist-util-visit";
import { onImagePasted } from "../utils/onImagePasted";
import styles from "../styles/Home.module.css";
import type { Root, Element } from "hast";

// SSR非対応のため dynamic import
const MDEditor = dynamic(import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className={styles.loading}>initializing...</div>,
});

const IndexPage = () => {
  const [markdown, setMarkdown] = useState<string>("");

  // 第1引数は「初期値」。空文字にすること。
  //   フィールドIDは“スキーマ側で”拡張フィールドにこのURLを割り当てることで紐づきます。
  const { data, sendMessage } = useFieldExtension<string>("", {
    origin: process.env.NEXT_PUBLIC_MICROCMS_ORIGIN!, // 例: https://your-service.microcms.io
    height: 543,
  });

  // microCMSから届いた初期値を反映（送信はしない）
  useEffect(() => {
    if (typeof data !== "undefined") setMarkdown(data ?? "");
  }, [data]);

  // 値の更新 + microCMSへ送信（ラッパは message.data を内部で組み立てる）
  const updateValue = (value: string) => {
    const safe = value ?? "";
    setMarkdown(safe);
    // ✅ 正しい形：{ data: 値 } だけ渡す（id/type/message を自前で組まない）
    sendMessage({ data: safe }); // React版READMEの形に一致
  };

  return (
    <div data-color-mode="light" className={styles.container}>
      <MDEditor
        value={markdown}
        previewOptions={{
          rehypePlugins: [
            [
              rehypeSanitize,
              {
                ...defaultSchema,
                attributes: {
                  ...defaultSchema.attributes,
                  span: [...(defaultSchema?.attributes?.span || []), ["className"]],
                  code: [["className"]],
                  img: [
                    ...(defaultSchema?.attributes?.img || []),
                    ["src", "alt", "title"],
                  ],
                },
              },
            ],
            // aタグに target="_blank"
            () => (tree: Root) => {
              visit(tree, "element", (node: Element) => {
                if (node.tagName === "a") {
                  node.properties = node.properties || {};
                  node.properties.target = "_blank";
                }
              });
            },
          ],
        }}
        onChange={(v) => updateValue(v ?? "")}
        height={540}
        textareaProps={{ placeholder: "Please enter Markdown text" }}
        onDrop={async (event) => {
          event.preventDefault();
          const textarea = event.currentTarget.querySelector("textarea");
          const selectionStart = textarea?.selectionStart ?? 0;
          const selectionEnd = textarea?.selectionEnd ?? selectionStart;

          const result = await onImagePasted(
            event.dataTransfer,
            markdown,
            selectionStart,
            selectionEnd
          );

          if (result) {
            updateValue(result.newMarkdown);
            if (textarea) {
              textarea.selectionStart = result.newCursor;
              textarea.selectionEnd = result.newCursor;
            }
          }
        }}
      />
    </div>
  );
};

export default IndexPage;