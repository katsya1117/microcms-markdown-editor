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

// Markdown Editor for ReactはSSRで利用できないためdynamic importで読み込む必要がある
const MDEditor = dynamic(import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className={styles.loading}>initializing...</div>,
});

const IndexPage = () => {
  const [markdown, setMarkdown] = useState<string | undefined>();
  const { data, sendMessage } = useFieldExtension("", {
    origin: process.env.NEXT_PUBLIC_MICROCMS_ORIGIN!,
    height: 543,
  });

  useEffect(() => {
    if (!markdown) {
      setMarkdown(data);
    }
  }, [markdown, data]);

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
                },
              },
            ],
            // aタグに target="_blank" を付与するプラグイン
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
          setMarkdown(value);
          sendMessage({
            data: value,
          });
        }}
        height={540}
        textareaProps={{
          placeholder: "Please enter Markdown text",
        }}
        onDrop={async (event) => {
          event.preventDefault();
          await onImagePasted(event.dataTransfer, setMarkdown);
        }}
      />
    </div>
  );
};

export default IndexPage;
