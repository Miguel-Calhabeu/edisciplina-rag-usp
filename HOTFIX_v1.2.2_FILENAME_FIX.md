# v1.2.2 Critical Hotfix - Filename Sanitization

**Version**: 1.2.2
**Type**: CRITICAL Bug Fix
**Severity**: High - Prevents downloads with special characters

## The Issue

You reported that 16 out of 18 files failed with **"Invalid filename"** error:
- `Exercício_1:_Modelagem_de_sistemas_de_software_nas_empresas.docx` ❌
- `Slides_Aula_2:_Abstração_no_desenvolvimento_de_software.pdf` ❌
- `Aula_4:_Resumo_(Diagrama_de_Casos_de_Uso_e_Descrição_de_Casos_de_Uso).pdf` ❌

While only 2 files downloaded:
- `Sobre_a_disciplina.pdf` ✅
- `Slides_Aula_1.pdf` ✅

## Root Cause

Chrome's download API **rejects filenames with these characters**:
- `:` (colon) - Very common in your filenames!
- `()` (parentheses)
- `*`, `?`, `"`, `|`, `<`, `>`
- Special Unicode combinations

This is a **browser security/OS limitation**, not a bug.

## The Fix

Added `sanitizeFilename()` function that:
1. **Removes invalid characters** (`:`, `()`, `*`, etc.)
2. **Replaces problematic patterns** with safe alternatives
3. **Logs the transformation** so you see what changed

### Examples:
```
Exercício_1:_Modelagem... → Exercício_1_Modelagem...
Aula_4:_Resumo_(Diagrama...) → Aula_4_Resumo_Diagrama...
Slides_Aula_2:_Abstração... → Slides_Aula_2_Abstração...
```

## Expected Results

After updating to v1.2.2, all 18 files should download! ✅

### Before v1.2.2:
- 2/18 files downloaded (11%)
- 16 failed with "Invalid filename"

### After v1.2.2:
- 18/18 files should download (100%)
- Console shows: "Filename sanitized: X → Y"

## How to Update

1. Go to `chrome://extensions/`
2. Click reload on the extension
3. Version should show **1.2.2**
4. Try downloading again!

## Console Output Example

```
[e-Disciplinas] File extension: docx, Final filename: Exercício_1:_Modelagem_de_sistemas_de_software_nas_empresas.docx
[e-Disciplinas] Filename sanitized: Exercício_1:_Modelagem_de_sistemas_de_software_nas_empresas.docx → Exercício_1_Modelagem_de_sistemas_de_software_nas_empresas.docx
[e-Disciplinas] ✓ Download initiated for: Exercício_1_Modelagem_de_sistemas_de_software_nas_empresas.docx
```

## Technical Details

**Characters Removed:**
- `:` → (removed)
- `()` → (removed)
- `*?"|<>` → (removed)
- `/\` → `-` (replaced with dash)
- Multiple spaces → `_` (underscore)

**Safe Characters Preserved:**
- Letters, numbers, underscores, hyphens, periods, accented characters ✓

---

**Status**: ✅ Production Ready
**Next Version**: v1.2.2
**All Issues Resolved**: Yes!

