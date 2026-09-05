# Installing journi on Windows

journi is a full-stack app: a React frontend, an Express API backend, and a
local SQLite database — all running as one process on your PC. There is
nothing to install in the cloud and no account to create; everything stays on
your machine (or your local network, if you choose to share it — see below).

## What you need first

- **Windows 10 or 11.**
- **Node.js, version 18 or newer.** If you don't have it, download the
  **LTS** installer for Windows from **https://nodejs.org/** and run it —
  the defaults are fine. journi's installer checks for this automatically
  and will tell you if it's missing.

You do **not** need Python, Visual Studio Build Tools, Docker, or any
database software installed separately. journi's backend picks whichever of
two SQLite drivers actually works on your installed Node.js version: the one
built directly into Node 22.5+ (no install step at all), or, on an older
Node, a small package with a ready-built driver for Windows — either way,
nothing needs to be compiled on your machine.

## Installing

1. Unzip the `journi` folder wherever you'd like it to live permanently
   (e.g. `C:\journi`). It doesn't need admin rights and doesn't touch
   anything outside its own folder.
2. Double-click **`install.bat`**.
3. A black command-prompt window opens and does four things: checks for
   Node.js, installs the frontend's dependencies, builds the frontend, and
   installs the backend's dependencies. This takes a minute or two the
   first time (it needs an internet connection to download packages), and
   is silent after — you don't need to click through anything.
4. When it's done it creates a **`journi`** shortcut on your Desktop and
   prints "Install complete!". Press any key to close the window.

## Starting journi

Double-click **`start-journi.bat`** (or the **journi** shortcut on your
Desktop). A command-prompt window opens, and your default browser opens
automatically to **http://localhost:4000/** a couple of seconds later. Sign
in as any of the demo users to get started.

**Keep that command-prompt window open** while you're using journi — it's
running the app. Closing it (or pressing Ctrl+C inside it) stops journi;
your data is not lost, it's saved to disk continuously, and reopening
`start-journi.bat` picks up exactly where you left off.

If Windows Firewall asks whether to allow Node.js to communicate on a
network, choose **Allow** (or restrict it to *Private networks* if you'd
rather journi not be reachable from outside your own network — see
below).

## Where your data lives

Everything you enter in journi — organizations, projects, ADKAR scores,
risks, everything — is saved to a single file:

```
<the journi folder>\server\data\journi.db
```

This file is created automatically the first time you start journi. To back
up your data, copy that one file somewhere safe. To reset back to the demo
data, either use journi's own **Reset Demo Data** option inside the app
(Settings), or close journi and delete `server\data\journi.db` — a fresh one
with the demo seed is created the next time you start it.

## Using journi from another PC on your network (optional)

Because journi runs a real backend rather than keeping everything in one
browser tab, other computers on the same office/home network can reach it
too — useful if a few people want to look at the same project data.

On the PC running journi, find its local IP address (open Command Prompt and
run `ipconfig`, look for "IPv4 Address", e.g. `192.168.1.42`). From another
PC on the same network, open a browser to `http://192.168.1.42:4000/`. Make
sure Windows Firewall is set to allow Node.js on your **Private** network
profile when prompted.

This is a single shared instance, not a multi-tenant server — everyone
connecting sees and edits the same data, the same way multiple browser tabs
on one PC would.

## Stopping / uninstalling

- **To stop journi:** close its command-prompt window, or press Ctrl+C
  inside it.
- **To uninstall:** back up `server\data\journi.db` if you want to keep your
  data, then just delete the whole `journi` folder. Nothing is installed
  outside of it (no registry entries, no services, no files elsewhere on
  the system).

## Troubleshooting

**"Node.js was not found on your PATH."** — Install Node.js from
https://nodejs.org/ (the LTS version), then run `install.bat` again. If
you just installed Node.js and still see this, restart your computer once —
Windows sometimes needs that to pick up the updated PATH.

**`install.bat` shows red `npm error gyp` lines mentioning Python, a
compiler, or Visual Studio.** — This is safe to ignore. journi's backend
tries two database drivers and only needs one to work: the one built
directly into Node.js 22.5+, or (on an older Node) a small package with a
ready-built driver for Windows. The messages you're seeing are from an
attempt to compile that second option from source, which only happens if no
ready-built version matches your exact Node version — and it's set up so a
failure there doesn't stop the rest of the install. Look further down the
output for "Install complete!"; if you see it, everything worked and you
can ignore the red text above it. If install.bat genuinely stops with
"Something went wrong during install," the real problem is a different
line above that message — the same troubleshooting steps here apply, or
try the fix below (updating Node.js) which sidesteps the compiled-driver
path entirely.

**Simplest fix if you want to avoid this message altogether:** install the
latest Node.js **LTS** from https://nodejs.org/ (22.5 or newer) — journi
then uses the driver built into Node itself and never needs to compile
anything.

**"Port 4000 is already in use."** — Another program (or another copy of
journi) is already using port 4000. Close the other program, or edit
`start-journi.bat` and change `set PORT=4000` to a different number (e.g.
`4100`) on both the `start` line and the `node index.js` line's environment.

**The browser opened but shows "can't connect."** — The server usually
finishes starting a second or two after the browser opens automatically.
Just refresh the page. If it still fails after a few seconds, check the
command-prompt window for an error message.

**Antivirus flags `node.exe` or the install.** — This is a common false
positive for any Node.js app the first time it runs on a machine; Node.js
itself is a well-known, legitimate runtime (the same one many developer
tools use). If your organization's antivirus blocks it outright, ask your
IT team to allow `node.exe` running from the journi folder.
