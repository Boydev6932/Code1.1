#!/usr/bin/env python3
"""
bump_version.py
- อัปเดต query param ?v=<mtime> สำหรับไฟล์ JS ที่ระบุใน index.html
- สามารถรันครั้งเดียว หรือรันแบบ --watch เพื่อเฝ้าดูการเปลี่ยนแปลงของไฟล์
- Usage:
    python3 bump_version.py          # bump once (default index and targets)
    python3 bump_version.py --watch  # watch targets and bump when changed
    python3 bump_version.py --index path/to/index.html js/script.js js/bg-slideshow.js
    python3 bump_version.py --interval 1 --watch
"""
import os
import re
import sys
import time
import shutil
import argparse

DEFAULT_INDEX = "index.html"
DEFAULT_TARGETS = ["js/script.js", "js/bg-slideshow.js"]

def get_mtime_version(path):
    try:
        return str(int(os.path.getmtime(path)))
    except Exception:
        return str(int(time.time()))

def bump(index_path, targets):
    if not os.path.isfile(index_path):
        print(f"[ERROR] index file not found: {index_path}", file=sys.stderr)
        return False

    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    total_changes = 0

    for t in targets:
        version = get_mtime_version(t)
        # match src="js/script.js" or src="/js/script.js" with optional ?v=...
        escaped = re.escape(t.lstrip("/"))
        pattern = re.compile(r'(src\s*=\s*["\']\/?' + escaped + r')(\?v=[^"\']*)?(["\'])', re.IGNORECASE)
        replacement = r'\1?v=' + version + r'\3'
        new_content, n = pattern.subn(replacement, new_content)
        total_changes += n
        print(f"[INFO] {t} -> v={version} (replacements: {n})")

    if new_content != content:
        backup = index_path + ".bak"
        try:
            shutil.copyfile(index_path, backup)
        except Exception as e:
            print(f"[WARN] Could not create backup: {e}")
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"[OK] Updated {index_path} (backup: {backup}). Total replacements: {total_changes}")
    else:
        print("[OK] No changes required.")

    return True

def watch(index_path, targets, interval):
    # initial mtimes
    last_mtimes = {}
    for t in targets:
        try:
            last_mtimes[t] = os.path.getmtime(t)
        except Exception:
            last_mtimes[t] = None

    print(f"[WATCH] Watching {len(targets)} files. Interval: {interval}s. Ctrl-C to stop.")
    try:
        while True:
            changed = False
            for t in targets:
                try:
                    cur = os.path.getmtime(t)
                except Exception:
                    cur = None
                if last_mtimes.get(t) != cur:
                    print(f"[WATCH] Change detected: {t} (prev={last_mtimes.get(t)} now={cur})")
                    last_mtimes[t] = cur
                    changed = True
            if changed:
                bump(index_path, targets)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[WATCH] Stopped by user.")
        return

def parse_args():
    p = argparse.ArgumentParser(description="Bump index.html script tags with ?v=<mtime>")
    p.add_argument("--index", "-i", default=DEFAULT_INDEX, help="Path to index.html")
    p.add_argument("targets", nargs="*", help="List of target JS files (relative)", default=DEFAULT_TARGETS)
    p.add_argument("--watch", "-w", action="store_true", help="Watch targets and bump on change")
    p.add_argument("--interval", "-t", type=float, default=1.0, help="Watch interval in seconds (default 1.0)")
    return p.parse_args()

def main():
    args = parse_args()
    targets = args.targets if args.targets else DEFAULT_TARGETS
    index_path = args.index

    # normalize target paths (strip leading slashes)
    targets = [t.lstrip("/") for t in targets]

    # initial bump to ensure index has versions now
    bump(index_path, targets)

    if args.watch:
        watch(index_path, targets, args.interval)

if __name__ == "__main__":
    main()
