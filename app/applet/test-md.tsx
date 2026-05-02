import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// String with a single backslash + text
const str1 = '$$17500 \text{ دج }$$'; 
// String with a double backslash + text
const str2 = '$$17500 \\text{ دج }$$'; 

console.log('Math string 1:', JSON.stringify(str1));
console.log('Math string 2:', JSON.stringify(str2));

const el1 = React.createElement(ReactMarkdown as any, {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex]
}, str1);

const el2 = React.createElement(ReactMarkdown as any, {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex]
}, str2);

try {
  console.log('Result 1:', renderToStaticMarkup(el1));
  console.log('Result 2:', renderToStaticMarkup(el2));
} catch(e) { console.error(e) }
