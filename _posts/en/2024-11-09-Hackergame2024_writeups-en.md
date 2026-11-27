---
title: "Hackergame 2024 Unofficial Writeups"
date: 2024-11-09 12:00:00 +0800
lang: en
translation_id: hackergame-2024
permalink: /2024/11/Hackergame2024_writeups/
redirect_from:
  - /en/2024/11/Hackergame2024_writeups/
tags: [CTF, Hackergame, ZFS, Security]
---

> This is an English overview of my Hackergame 2024 writeups. For the complete challenge logs, chat transcripts, and scripts, see the [original Chinese version](/zh/2024/11/Hackergame2024_writeups/).

## Overview

Hackergame 2024 overlapped with another competition this year, so I played casually and finished **392 / 2460** overall (peaking at **#142** at the time of my last submission on `2024-11-03 18:50:45`, before oversleeping past the deadline with 6 flags still unsubmitted).

Past official USTC Hackergame writeups:
[2023](https://github.com/ustc-hackergame/hackergame2023-writeups) ·
[2022](https://github.com/ustc-hackergame/hackergame2022-writeups) ·
[2021](https://github.com/ustc-hackergame/hackergame2021-writeups) ·
[2020](https://github.com/ustc-hackergame/hackergame2020-writeups) ·
[2019](https://github.com/ustclug/hackergame2019-writeups) ·
[2018](https://github.com/ustclug/hackergame2018-writeups/)

## Highlights of Solved Challenges

- **Check-in & Check-in Again**: Passing `/?pass=true` for the web check-in; inspecting environment variables, hidden `.flag` files, and NixOS clues in the terminal check-in.
- **Cat Quiz (10th Anniversary Edition)**: OSINT and historical trivia covering Hackergame 2015 classroom `3A204`, 2019 registration count (`2682`), 2018 USTC library top search term, USENIX Security 2024 email spoofing study (`336` combinations), Linux `MAINTAINERS` commit `6e90b6`, and Llama 3 70B token count (`1833`).
- **Unopenable Box & Too Many Daily Papers**: Inspecting a 3D model cross-section online and removing an occluding image layer inside a PDF to reveal the hidden flag.
- **Number Comparison King**: Adjusting the client-side 200ms cooldown timer in the browser console to complete 100 comparisons within the time limit.
- **Travel Photos 4.0**: Geolocation and OSINT across Hefei (USTC East Campus West Gate), Lu'an parks, Tanziling, and CRH6 Huairou–Miyun line near Beijing North EMU Depot & Jishuitan Hospital.
- **PaoluGPT**: Crawling conversation listings for the needle-in-a-haystack flag and analyzing the SQLite-backed query endpoint for the hidden entry.
- **Node.js is Web Scale & Powerful Regex**: JavaScript prototype-chain configuration challenge and constructing a finite-state decimal divisibility-by-16 regular expression.
- **Sparse Words 3.0 (Problem A) & Elegant Inequality (Easy)**: Reconstructing padded 80-byte lines against CRC-48/polynomial hashes and deriving the closed-form polynomial bound `4*((1-x**2)**(1/2)-(1-x**2))`.
- **Unobtainable Secret & Zero-Knowledge Sudoku**: Decoding animated QR streams (`qrtransfer`) and inspecting the client-side puzzle bundle for the first sub-challenge.
- **ZFS (and an Accidental Mirror Incident)**: Exploring ZFS snapshots and inspecting plaintext `zfs send` streams to recover the first flag—followed by accidentally running `sudo zfs unmount -a` on the live mirrors host used for testing and briefly unmounting the `ubuntu` dataset before hitting `Ctrl+C` ([issue #11](https://github.com/NYIST-CIPS/issues/issues/11)).
- **Docker for Everyone Plus**: Transferring a minimal locally built image via ZMODEM into `/tmp` and running the containerized verification steps.
