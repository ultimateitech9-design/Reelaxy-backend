#!/usr/bin/env python3
"""Record deploy progress for https://reelaxy.com/deploy-status.

Usage: status.py <frontend|backend> <deploying|success|failed> [step]
Writes /opt/reelaxy/status/deploy.json (served read-only by nginx).
Only commit hash, subject and times are published - never env or secrets.
"""
import json, os, subprocess, sys, tempfile
from datetime import datetime, timezone

ROOT = os.environ.get("REELAXY_ROOT", "/opt/reelaxy")
OUT = os.path.join(ROOT, "status", "deploy.json")
HISTORY = 25

def git(repo, *args):
    try:
        return subprocess.check_output(["git", "-C", repo, *args], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""

def main():
    target, state = sys.argv[1], sys.argv[2]
    step = sys.argv[3] if len(sys.argv) > 3 else ""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    repo = os.path.join(ROOT, f"Reelaxy-{target}")
    try:
        with open(OUT) as f:
            data = json.load(f)
    except Exception:
        data = {}
    data.setdefault("services", {})
    data.setdefault("history", [])

    svc = data["services"].get(target, {})
    commit = {
        "sha": git(repo, "rev-parse", "--short", "HEAD"),
        "subject": git(repo, "log", "-1", "--format=%s")[:140],
        "committedAt": git(repo, "log", "-1", "--format=%cI"),
    }
    if state == "deploying":
        svc = {**svc, "state": "deploying", "step": step, "startedAt": now, "finishedAt": None, "pending": commit}
    else:
        started = svc.get("startedAt") or now
        secs = int((datetime.fromisoformat(now) - datetime.fromisoformat(started)).total_seconds())
        entry = {"service": target, "state": state, "commit": commit, "startedAt": started, "finishedAt": now, "seconds": secs}
        svc = {**svc, "state": state, "step": step, "finishedAt": now, "seconds": secs, "pending": None}
        if state == "success":
            svc["live"] = commit
            svc["liveSince"] = now
        data["history"] = ([entry] + data["history"])[:HISTORY]
    data["services"][target] = svc
    data["updatedAt"] = now

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(OUT))
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, indent=1)
    os.chmod(tmp, 0o644)
    os.replace(tmp, OUT)

if __name__ == "__main__":
    main()
