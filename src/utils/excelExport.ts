/**
 * Utility for exporting data lists to Excel-compatible CSV formats with full Thai language support.
 * Uses the UTF-8 Byte Order Mark (BOM) so that Microsoft Excel reads and opens it correctly.
 */

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  fileNamePrefix: string
) {
  if (!data || data.length === 0) {
    alert("ไม่มีข้อมูลสำหรับส่งออกรายงาน (No data available to export)");
    return;
  }

  // Prepend UTF-8 BOM
  let csvContent = "\uFEFF";

  // Add Headers Row
  const headerLabels = headers.map(h => `"${String(h.label).replace(/"/g, '""')}"`);
  csvContent += headerLabels.join(",") + "\n";

  // Add Data Rows
  data.forEach(item => {
    const rowValues = headers.map(h => {
      const val = item[h.key];
      if (val === undefined || val === null) {
        return '""';
      }
      
      // Escape value and wrap in double quotes
      const stringified = String(val).replace(/"/g, '""');
      return `"${stringified}"`;
    });
    csvContent += rowValues.join(",") + "\n";
  });

  // Create downloadable blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  // Format Date for filename
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toLocaleTimeString("th-TH").replace(/:/g, "-");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileNamePrefix}_report_${dateStr}_${timeStr}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
