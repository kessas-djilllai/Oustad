import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1.0);
  const [progress, setProgress] = useState(0);
  
  const [containerWidth, setContainerWidth] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    };
    updateWidth();
    // Use debounce or timeout for reliable resize
    const timeout = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center w-full h-full relative min-w-0" ref={containerRef}>
      <div 
        className="w-full h-full overflow-auto bg-slate-100/50 relative p-0 overflow-y-auto overflow-x-auto" 
        dir="ltr"
      >
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 bg-slate-800/90 backdrop-blur text-white px-4 py-2 rounded-2xl sticky top-4 z-50 shadow-xl w-fit mx-auto max-w-full">
          <button
            onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm font-bold min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(s + 0.2, 3.0))}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        <div className="w-max min-w-full flex flex-col items-center p-2 md:p-6 pb-20 mt-4">
          <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadProgress={({ loaded, total }) => {
            if (total) {
               setProgress(Math.round((loaded / total) * 100));
            } else {
               setProgress(Math.min(95, progress + 5));
            }
          }}
          loading={
            <div className="py-10 flex flex-col items-center w-[90%] max-w-xs mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-3xl z-50 p-6 border border-slate-200">
              <div className="text-slate-600 font-bold mb-4 flex flex-col items-center">
                 <div className="flex gap-1.5 mb-6">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                 </div>
                <span dir="rtl">جاري تحميل الملف...</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex mb-2">
                 <div className="h-full bg-blue-600 transition-all duration-300 relative rounded-full" style={{ width: `${Math.max(5, progress)}%` }}>
                 </div>
              </div>
              <p className="text-sm text-blue-600 font-bold" dir="ltr">{progress}%</p>
            </div>
          }
          error={
            <div className="py-20 text-red-500 font-bold text-center">
              حدث خطأ أثناء تحميل الملف.
              <br/>
              <span className="text-sm font-normal text-slate-400">تأكد من صلاحيات الملف أو اتصاله بالإنترنت.</span>
            </div>
          }
        >
          {Array.from(new Array(numPages || 0), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              scale={scale}
              width={containerWidth ? containerWidth : undefined}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl mx-auto rounded-lg overflow-hidden bg-white select-none relative mb-6"
              loading={
                  <div className="py-20 flex flex-col items-center w-full justify-center bg-white/50 animate-pulse min-h-[500px]">
                     <div className="flex gap-1.5 mb-4">
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                     </div>
                     <p className="text-slate-500 font-bold text-sm">جاري عرض الصفحة {index + 1}...</p>
                  </div>
              }
            />
          ))}
        </Document>
        </div>
      </div>
    </div>
  );
}
