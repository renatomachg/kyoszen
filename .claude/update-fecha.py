#!/usr/bin/env python3
import re
from datetime import date
from pathlib import Path

path = Path(__file__).parent.parent / "CLAUDE.md"
today = date.today().strftime("%Y-%m-%d")
content = path.read_text()

def replace(m):
    rest = m.group(1) or ""
    return today + rest

new_content = re.sub(
    r"^\d{4}-\d{2}-\d{2}( —[^\n]*)?",
    replace,
    content,
    count=1,
    flags=re.MULTILINE,
)

path.write_text(new_content)
print(f"Fecha actualizada: {today}")
