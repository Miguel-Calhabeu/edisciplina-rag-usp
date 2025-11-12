# Fix: File Extension Preservation (v1.1.1)

## Problem
Files were being downloaded without their file extensions (e.g., `Aula1` instead of `Aula1.pdf`), preventing the OS from knowing how to open them.

## Solution
Added automatic file extension extraction from the download URL and appended it to the filename.

## What Changed

### In `content.js`:

**1. Added `extractFileExtension()` function**
```javascript
function extractFileExtension(url) {
  // Parses URL to extract file extension
  // Example: "https://...pluginfile.php/.../file.pdf?token=xyz"
  // Returns: "pdf"
}
```

**2. Updated `downloadAllFiles()` to use extension**
```javascript
// Before:
await chrome.runtime.sendMessage({
  action: 'downloadFile',
  url: fileUrl,
  filename: fileName,  // "Aula1" ❌
  courseCode: courseCode
});

// After:
const fileExtension = extractFileExtension(fileUrl);
const fileNameWithExtension = fileExtension ? `${fileName}.${fileExtension}` : fileName;
// Now: "Aula1.pdf" ✅

await chrome.runtime.sendMessage({
  action: 'downloadFile',
  url: fileUrl,
  filename: fileNameWithExtension,  // "Aula1.pdf" ✅
  courseCode: courseCode
});
```

## How It Works

1. **Extract URL**: Get the final download URL (e.g., `pluginfile.php/9181664/mod_resource/content/1/Aula1.pdf?token=xyz`)
2. **Parse**: Extract file path from URL (handles query parameters)
3. **Find Extension**: Match the extension with regex `\.([^.]+)$` (captures `.pdf` → `pdf`)
4. **Append**: Add extension to filename: `Aula1` + `.` + `pdf` = `Aula1.pdf`
5. **Download**: Files now download with correct extensions

## Examples

| URL | Extension | Filename | Final |
|-----|-----------|----------|-------|
| `...Aula1.pdf?token=xyz` | `pdf` | `Aula1_Introducao` | `Aula1_Introducao.pdf` |
| `...trabalho.docx` | `docx` | `Trabalho_Final` | `Trabalho_Final.docx` |
| `...slide.pptx?lang=pt` | `pptx` | `Slides_Aula2` | `Slides_Aula2.pptx` |
| `...dados.xlsx` | `xlsx` | `Planilha_Dados` | `Planilha_Dados.xlsx` |
| `...codigoCompilado` | `null` | `Codigo_Fonte` | `Codigo_Fonte` (no ext) |

## Benefits

✅ **Files are now openable** - OS recognizes file types  
✅ **Automatic detection** - Works with any file extension  
✅ **Fallback handling** - If no extension found, uses filename as-is  
✅ **Case normalization** - Extensions stored lowercase (.PDF → .pdf)  
✅ **Query parameter safe** - Handles URLs with tokens and parameters  

## Update Instructions

1. **Reload extension** at `chrome://extensions/` (click 🔄)
2. **Test**: Download files from course page
3. **Verify**: Files now have correct extensions (e.g., `Aula1.pdf` not `Aula1`)
4. **Done!** OS can now open files automatically

## Testing

Try downloading different file types to verify:
- ✅ `.pdf` files
- ✅ `.docx` files
- ✅ `.xlsx` files
- ✅ `.pptx` files
- ✅ `.zip` files
- ✅ Other file types

---

**Version**: 1.1.1  
**Date**: November 11, 2025  
**Status**: ✅ Complete

Files now download with proper extensions and can be opened directly! 🎉
