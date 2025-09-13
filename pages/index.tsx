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

  // フィールドID "body" に拡張フィールドを紐づける
  const { data, sendMessage } = useFieldExtension("body", {
    origin: process.env.NEXT_PUBLIC_MICROCMS_ORIGIN!,
    height: 543,
  });

  // 初期値を受け取る（この時点では sendMessage は呼ばない）
  useEffect(() => {
    if (data !== undefined) {
      setMarkdown(data);
    }
  }, [data]);

  // 値を更新して microCMS に送信する関数
  const updateValue = (value: string) => {
    setMarkdown(value);
    sendMessage(value); // v1.1.0 ではこれだけでOK
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
                  span: [
                    ...(defaultSchema?.attributes?.span || []),
                    ["className"],
                  ],
                  code: [["className"]],
                  img: [
                    ...(defaultSchema?.attributes?.img || []),
                    ["src", "alt", "title"],
                  ],
                },
              },
            ],
            // aタグに target="_blank" を付与
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
        onChange={(value) => {
          updateValue(value ?? "");
        }}
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