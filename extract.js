const fs = require('fs');

const lines = fs.readFileSync('src/pages/Admin.tsx', 'utf-8').split('\n');

const analyzeLines = lines.slice(1671, 2124); // 0-indexed: 1672 to 2124

const result = `import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";
import { triggerAlert } from "./Admin";
import { ChevronRight, FileText, Wand2, Plus, Upload, AlertCircle } from "lucide-react";

` + analyzeLines.join('\n').replace(/function AdminAnalyzePdf/, 'export function PdfBacAnalis');

fs.writeFileSync('src/pages/PdfBacAnalis.tsx', result);
