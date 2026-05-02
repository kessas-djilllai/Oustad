import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// String with real backslash followed by t
const str1 = 'PV = 17500 \\text{ دج }'; 

const render = (s) => renderToStaticMarkup(React.createElement(ReactMarkdown as any, { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }, s));

console.log('Result:', render(str1));
