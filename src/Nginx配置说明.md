
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen 80;
        server_name  localhost;

        location / {
            root   html;
            try_files $uri $uri/ /index.html;
            index index.html index.htm;
        }
     # API 代理
    location /api/ {
        proxy_pass http://121.4.22.55:5202;   #proxy_pass http://121.4.22.55:5202/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS 头（如果后端没有设置）
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type';
     }

    }
}

# API 代理
例如后端server.js：
app.get('/api/GetHousePricePictures',
前端js
const response = await axios.get('/api/GetHousePricePictures',
然后通过 Nginx 反向代理，将请求转发到指定地址
location /api/
proxy_pass http://121.4.22.55:5202; 

前端就实现了类似
app.get('http://121.4.22.55:5202/api/GetHousePricePictures',


前端代码:
axios.get('/api/GetHousePricePictures')
        ↓
浏览器实际请求:
GET http://121.4.22.55:5202/api/GetHousePricePictures
        ↓
Nginx 服务器接收到请求
(当前端和 Nginx 同域时)
        ↓
Nginx 匹配 location /api/
        ↓
Nginx 转发请求到:
http://121.4.22.55:5202/api/GetHousePricePictures
        ↓
后端服务器处理:
app.get('/api/GetHousePricePictures', ...)
配置情况
nginx
# Nginx 配置
location /api/ {
    proxy_pass http://121.4.22.55:5202;  # 注意：这里没有斜杠！
}