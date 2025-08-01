import subprocess
import os

output_file = "git_files_export_frontend.txt"

# Get list of tracked files using git
files = subprocess.check_output(["git", "ls-files"], text=True).splitlines()

with open(output_file, "w", encoding="utf-8") as out:
    for filepath in files:
        out.write(f"--- File: {filepath} ---\n")
        if os.path.isfile(filepath):
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                out.write(f.read())
        else:
            out.write("[File not found]\n")
        out.write("\n\n")
print(f"Exported {len(files)} files to {output_file}")

