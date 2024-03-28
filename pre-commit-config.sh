#!/bin/sh

searches=(
"index.html"
"
(\?version=)([0-9.]+)([\'\"])
(version[\'\"]>v)([0-9.]+)([</])
"
)
