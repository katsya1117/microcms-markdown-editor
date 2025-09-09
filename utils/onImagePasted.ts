import { fileUploader } from "./fileUploader";
import { insertToTextArea } from "./insertToTextArea";

export const onImagePasted = async (
  dataTransfer: DataTransfer,
  currentMarkdown: string | undefined,
  selectionStart: number,
  selectionEnd: number
): Promise<{ newMarkdown: string; newCursor: number } | undefined> => {
  const files: File[] = [];
  for (let i = 0; i < dataTransfer.items.length; i++) {
    const file = dataTransfer.files.item(i);
    if (file) files.push(file);
  }

  let newMarkdown = currentMarkdown ?? "";
  let newCursor = selectionStart;

  for (const file of files) {
    const url = await fileUploader(file);
    if (!url) continue;

    const result = insertToTextArea(`![](${url})`, newMarkdown, newCursor, selectionEnd);
    newMarkdown = result.newMarkdown;
    newCursor = result.newCursor;
  }

  return { newMarkdown, newCursor };
};