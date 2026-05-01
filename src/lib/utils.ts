export const preprocessMath = (text: string) => {
  if (!text) return text;
  
  let processed = text.toString();

  // Try to clean up $ ... $ and $$ ... $$ without touching the text inside if not necessary.
  processed = processed.replace(/\$(\$)?\s*([\s\S]*?)\s*(\$)?\$/g, (match, p1, p2, p3) => {
    const isDouble = p1 === '$' || p3 === '$';
    const content = p2.trim();
    if (isDouble) {
      return `$$${content}$$`;
    }
    return `$${content}$`;
  });

  // Completely remove triple backticks as they break KaTeX by wrapping content in <code> blocks
  processed = processed.replace(/```[a-zA-Z]*\n?([\s\S]*?)\n?```/g, '$1');
  
  // Single backticks wrapped around math formulas
  processed = processed.replace(/`(\$[^`]+\$)`/g, '$1');

  // Prevent accidental code blocks in markdown due to 4+ spaces or tabs indentation
  // Only remove 4 spaces at the very beginning of the line if it is not part of a list
  processed = processed.replace(/^(?!\s*[-*0-9]+[.)]) {4,}/gm, '  ');
  processed = processed.replace(/^\t+/gm, '  ');

  return processed;
};
