export const insertToTextArea = (
  insertString: string,
  currentMarkdown: string | undefined,
  selectionStart: number,
  selectionEnd: number
): { newMarkdown: string; newCursor: number } => {
  const text = currentMarkdown ?? "";

  const front = text.slice(0, selectionStart);
  const back = text.slice(selectionEnd);

  const newMarkdown = front + insertString + back;
  const newCursor = selectionStart + insertString.length;

  return { newMarkdown, newCursor };
};