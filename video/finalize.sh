#!/bin/sh
# Финальные ролики: сайт (presentation/assets) и облегчённые для письма (video/mail), обложки jpg.
# sh video/finalize.sh  (из корня проекта)
set -e
mkdir -p presentation/assets video/mail
for n in idea guide; do
  src=video/$n/$n-raw.mp4
  [ -f "$src" ] || { echo "нет $src"; continue; }
  ffmpeg -v error -y -i "$src" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart presentation/assets/$n.mp4
  ffmpeg -v error -y -i "$src" -c:v libx264 -preset veryslow -crf 27 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart video/mail/$n.mp4
done
ffmpeg -v error -y -ss 54.6 -i video/idea/idea-raw.mp4 -frames:v 1 -q:v 3 presentation/assets/idea.jpg
ffmpeg -v error -y -ss 51 -i video/guide/guide-raw.mp4 -frames:v 1 -q:v 3 presentation/assets/guide.jpg
for f in idea.jpg guide.jpg; do ffmpeg -v error -y -i presentation/assets/$f -vf scale=960:-2 -q:v 5 video/mail/$f; done
ls -la presentation/assets/*.mp4 presentation/assets/*.jpg video/mail
