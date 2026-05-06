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

  // Fix literal JSON parsed escapes that break KaTeX
  processed = processed.replace(/(\\|\t)?t?ext/g, '\\text');
  processed = processed.replace(/(\\|\x08)?b?egin\s*\{/g, '\\begin{');
  processed = processed.replace(/(\\|\x08)?e?nd\s*\{/g, '\\end{');
  processed = processed.replace(/(\\|\x0C)?f?rac\s*\{/g, '\\frac{');
  processed = processed.replace(/(\\|\x0D)?r?ight/g, '\\right');
  processed = processed.replace(/(\\|\x0C)?l?eft/g, '\\left');
  processed = processed.replace(/\\(lim|sqrt|sum|int|infty|rightarrow)/g, '\\$1');
  
  // Wrap naked \begin{cases} in $$ if they aren't enclosed
  processed = processed.replace(/(?<!\$)(?<!\$\$)\s*(\\begin\{(cases|align|equation|pmatrix|bmatrix)\}[\s\S]*?\\end\{\2\})\s*(?!\$)(?!\$\$)/g, '\n\n$$$$ $1 $$$$\n\n');

  // Ensure markdown tables have a preceding newline to be parsed correctly by remark-gfm
  // This looks for a non-newline character, followed by a newline, followed by a table header and separator.
  processed = processed.replace(/([^\n])\n(\s*\|[^\n]+\|\s*\n\s*\|[-:\| ]+\|\s*(\n|$))/g, '$1\n\n$2');

  return processed;
};
