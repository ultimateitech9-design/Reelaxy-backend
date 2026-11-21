#!/usr/bin/env python3
"""Record deploy progress for https://reelaxy.com/deploy-status.

Usage: status.py <frontend|backend> <deploying|success|failed> [step]
       status.py check        # compare GitHub main with what is deployed (systemd timer, every 60 s)
Writes /opt/reelaxy/status/deploy.json (served read-only by nginx).
Only commit hash, subject and times are published - never env or secrets.
"""
import fcntl, json, os, subprocess, sys, tempfile
from datetime import datetime, timezone

ROOT = os.environ.get("REELAXY_ROOT", "/opt/reelaxy")
OUT = os.path.join(ROOT, "status", "deploy.json")
HISTORY = 25

def git(repo, *args):
    try:
        return subprocess.check_output(["git", "-C", repo, *args], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""

def load():
    try:
        with open(OUT) as f:
            return json.load(f)
    except Exception:
        return {}

def save(data):
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(OUT))
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, indent=1)
    os.chmod(tmp, 0o644)
    os.replace(tmp, OUT)

def check(data, now):
    """Latest commit on GitHub main for each repo (via the VPS deploy keys)."""
    data.setdefault("github", {})
    for target in ("frontend", "backend"):
        repo = os.path.join(ROOT, f"Reelaxy-{target}")
        try:
            out = subprocess.check_output(["timeout", "25", "git", "-C", repo, "ls-remote", "origin", "refs/heads/main"],
                                          text=True, stderr=subprocess.DEVNULL).split()
            data["github"][target] = {"sha": out[0][:7], "checkedAt": now, "ok": True}
        except Exception:
            prev = data["github"].get(target, {})
            data["github"][target] = {**prev, "checkedAt": now, "ok": False}
    data["checkedAt"] = now

def main():
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    lock = open(OUT + ".lock", "w")
    fcntl.flock(lock, fcntl.LOCK_EX)
    data = load()
    if sys.argv[1] == "check":
        check(data, now)
        save(data)
        return
    target, state = sys.argv[1], sys.argv[2]
    step = sys.argv[3] if len(sys.argv) > 3 else ""
    repo = os.path.join(ROOT, f"Reelaxy-{target}")
    data.setdefault("services", {})
    data.setdefault("history", [])

    svc = data["services"].get(target, {})
    commit = {
        "sha": git(repo, "rev-parse", "--short", "HEAD"),
        "subject": git(repo, "log", "-1", "--format=%s")[:140],
        "committedAt": git(repo, "log", "-1", "--format=%cI"),
    }
    if state == "deploying":
        # Keep the start time across steps (pull -> build -> start) of the same deploy.
        started = svc.get("startedAt") if svc.get("state") == "deploying" and step != "pull" else now
        svc = {**svc, "state": "deploying", "step": step, "startedAt": started, "finishedAt": None, "pending": commit}
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
    if state == "success":
        data.setdefault("github", {})
        gh = data["github"].get(target)
        # The commit just deployed is at least as new as what we last saw on GitHub.
        if not gh or gh.get("sha") != commit["sha"]:
            data["github"][target] = {"sha": commit["sha"], "checkedAt": now, "ok": True}
    save(data)

if __name__ == "__main__":
    main()
