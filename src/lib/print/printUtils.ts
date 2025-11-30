export function printDocument(elementId: string) {
  const printLayout = document.getElementById(elementId);
  if (!printLayout) return;
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) return;
  
  // Write content to iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; }
          @page { margin: 0.5in; }
        </style>
      </head>
      <body>
        ${printLayout.innerHTML}
      </body>
    </html>
  `);
  iframeDoc.close();
  
  // Print iframe and remove it
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 100);
  }, 250);
}
