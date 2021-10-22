docker build -t bmmcgui/cu-smart .
docker push bmmcgui/cu-smart

ssh fmo14 "docker pull bmmcgui/cu-smart"
ssh fmo14 'docker kill $(docker ps --filter="publish=3000" --format "{{.Names}}")'
ssh fmo14 "docker run -p 3000:3000 -d --mount source=cu-smart-feedback,target=/data --restart always bmmcgui/cu-smart"