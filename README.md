# The World in One Day — Friday 27 November 2026 in One Image

[![news-image-20261127](https://make.fun/badge/news-image-20261127.svg)](https://make.fun/bounty/news-image-20261127)
[![rank](https://make.fun/badge/news-image-20261127/ChristaNavisa/news-image-20261127/rank.svg)](https://make.fun/bounty/news-image-20261127)
[![reward](https://make.fun/badge/news-image-20261127/ChristaNavisa/news-image-20261127/reward.svg)](https://make.fun/bounty/news-image-20261127)

A newspaper front page that sums up Friday, 27 November 2026 in a single
image: a dated masthead, six illustrated stories from that day, and a ticker
of further stories from the day.

The six stories, each recognisable from its picture and short labels:

1. Middle East — a drone strike in Kuwait kills two Italian workers; Iran
   denies it was behind the attack.
2. United States — Thanksgiving storms black out 800,000; Macy's 100th
   parade is postponed and 1,000+ flights are cancelled.
3. Gaza — Israel kills 10; Hamas weighs its response.
4. Chess — World Championship Game 3 ends in a marathon draw; Gukesh and
   Sindarov stay level at 1.5–1.5 after three games.
5. United Kingdom — net migration falls to its lowest since 1997.
6. Mediterranean — a diesel tanker carrying 7,000 tonnes capsizes off
   Ibiza, one dead.

The ticker adds: Ebola in Congo passes 12,000 cases, a Bangkok refinery
blast injures nine, Gérard Depardieu is to stand trial, and Trump demands a
probe of "fake" GDP figures.

## How it works

`main.ts` (Node, standard library only) draws the whole page — masthead,
six illustrated panels, ticker — with a small built-in 5x7 bitmap font and
a hand-written PNG encoder, then writes `entry.png` (1024x1024) to
`$MAKEFUN_OUTPUT_DIR` (default `/output`). No image libraries, no network,
no assets: the same input always produces the same bytes.
