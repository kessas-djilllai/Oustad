import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// If it's outside math mode:
// Tab + ext
const str1 = 'PV = 17500 \t' + 'ext دج'; 
// Replaced with single backslash
const str2 = 'PV = 17500 \\text دج'; 
// Replaced with double backslash
const str3 = 'PV = 17500 \\\\text دج'; 

const render = (s) => renderToStaticMarkup(React.createElement(ReactMarkdown as any, { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }, s));

console.log('Original (TAB+ext):', render(str1));
console.log('Single Backslash:', render(str2));
console.log('Double Backslash:', render(str3));

