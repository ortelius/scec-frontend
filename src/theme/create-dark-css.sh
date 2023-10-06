#!/usr/bin/env sh

sed -e 's/@charset "UTF-8";/\.dark {/' -e 's/calc(0 -/calc(0% -/' <src/theme/work/smui-dark.css | awk '1; END {print "}"}' >src/theme/work/_smui-theme.scss
rm src/theme/work/smui-dark.css
