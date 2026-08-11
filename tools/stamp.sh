#!/bin/bash
# 配信前に scriptタグの版数を打ち直す。GitHub Pages は max-age=600 で配るので、
# 版数を固定したままだと古いJSがブラウザに残り続ける（ボタンが出ない等の原因になる）。
cd "$(dirname "$0")/.."
V=$(date +%Y%m%d%H%M)
sed -i '' -E "s|(<script src=\"js/[a-z0-9]+\.js)\?v=[0-9]+|\1?v=$V|g" index.html
echo "version → $V"
