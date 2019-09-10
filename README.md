# Open Street Map Proxy 

Minimalist Open Street Map Proxy docker container in nodejs

## Usage

Pull repository

```bash
docker pull smeagolworms4/openstreetmap-proxy
```


Run container:

```bash
docker run -p 8080:80 -e openstreetmap-proxy
```

Access for test open:

```
http://127.0.0.1:8080/0/0/0.png
```

Force type in url:

```
http://127.0.0.1:8080/0/0/0.png?r=tile
http://127.0.0.1:8080/0/0/0.png?r=other
```

## Environment variables

```
ENV OSM_PROXY_PORT=80
ENV OSM_PROXY_CACHE_PATH=/var/cache/openstreetmap-proxy
ENV OSM_PROXY_LAYER_URL=http://{s}.{type}.openstreetmap.org/{z}/{x}/{y}.png
ENV OSM_PROXY_CACHE_LIFETIME=2592000
```

## Mount cache directory 

If you want persist cache directory

```bash
docker  run -v "$(pwd)/cache":/var/cache/openstreetmap-proxy -p 8080:80 openstreetmap-proxy
```