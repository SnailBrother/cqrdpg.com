 # Nginx 反向代理配置

## Nginx 配置

```
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
            proxy_pass https://www.cqrdpg.com:5202;   #proxy_pass https://www.cqrdpg.com:5202/api/;
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
```

## 后端代码示例
```
app.get('/api/GetHousePricePictures', (req, res) => {
    // 处理请求
});
```
## 前端代码示例
```
const response = await axios.get('/api/GetHousePricePictures');
```
## 工作原理

```
前端代码:
axios.get('/api/GetHousePricePictures')
        ↓
浏览器实际请求:
GET https://www.cqrdpg.com:5202/api/GetHousePricePictures
        ↓
Nginx 服务器接收到请求（当前端和 Nginx 同域时）
        ↓
Nginx 匹配 location /api/
        ↓
Nginx 转发请求到:
https://www.cqrdpg.com:5202/api/GetHousePricePictures
        ↓
后端服务器处理:
app.get('/api/GetHousePricePictures', ...)
```

## 关键配置说明
- 通过 Nginx 反向代理，前端请求 /api/GetHousePricePictures 会被转发到 https://www.cqrdpg.com:5202/api/GetHousePricePictures，从而实现跨域请求。

<br>
 
# 多功能集成平台数据库设计

## 📌 项目简介
本项目是一个集**聊天社交**、**音乐娱乐**、**办公协作**于一体的全栈应用平台。
以下为支撑三大业务板块的数据库分布设计说明。

---

## 数据库整体架构

### 1. 分库设计原则
按业务领域垂直拆分，降低耦合；用户基础信息集中共享，业务数据独立扩展。

### 2. 数据库清单
| 数据库名称 | 负责板块 | 核心职责 |
| :--- | :--- | :--- |
| **MusicApp** | 听歌娱乐 | 存储歌曲元数据、歌单、播放记录 |
| **WeChatApp** | 聊天社交 | 存储用户消息、会话、好友关系 |
| **OfficeApp** | 办公协作 | 存储文档、任务、会议、审批数据 |
| **AccountingApp** | 记账 | 记录日常开销 |
| **SportsApp** | 运动 | 记录日常运动 |
---
 
## 一、听歌板块数据库 (`MusicApp`)

### 1. 歌单  (`MusicApp.dbo.MusicList`)

```
CREATE TABLE MusicApp.dbo.MusicList (
    id INT IDENTITY(1,1) PRIMARY KEY,       -- 自增 ID 作为主键
    title NVARCHAR(255) NOT NULL,            -- 音乐标题，最大字符数 255
    artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    coverimage NVARCHAR(255),                -- 封面图像路径，最大字符数 255
    src NVARCHAR(255) NOT NULL,              -- 音乐文件源路径，最大字符数 255
    genre NVARCHAR(50),                      -- 歌曲类型（欧美、华语、韩语、其他等），最大字符数 50
    playcount INT DEFAULT 0,                 -- 播放量，默认为 0
    updatetime DATETIME DEFAULT GETDATE()    -- 更新时的当前时间，默认为当前时间
);
```

### 2. 评论 (`MusicApp.dbo.MusicComments`)

 ```
CREATE TABLE MusicApp.dbo.MusicComments (
    comment_id INT IDENTITY(1,1) PRIMARY KEY,  -- 自增 ID 作为主键
    music_id INT NOT NULL,                      -- 音乐 ID，外键引用 Music 表的 id
    user_name NVARCHAR(255) NOT NULL,           -- 评论的用户名称
    music_title NVARCHAR(255) NOT NULL,            -- 音乐标题，最大字符数 255
    music_artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    comment_text NVARCHAR(1000) NOT NULL,       -- 评论内容，最大字符数 1000
    created_at DATETIME DEFAULT GETDATE(),     -- 评论时间，默认当前时间
    FOREIGN KEY (music_id) REFERENCES MusicApp.dbo.MusicList(id) 
    ON DELETE CASCADE                           -- 当 MusicList 表中的歌曲删除时，删除该歌曲的评论
);
```

### 3. 收藏 (`MusicApp.dbo.MusicFavorites`)

 ``` 
CREATE TABLE MusicApp.dbo.MusicFavorites (
    id INT IDENTITY(1,1) PRIMARY KEY,        -- Unique Identifier
    music_id INT NOT NULL,                      -- 音乐 ID，外键引用 Music 表的 id
    user_name NVARCHAR(100) NOT NULL,              -- User who likes the song
    song_name NVARCHAR(255) NOT NULL,         -- Name of the song
    artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    play_count INT NOT NULL,                   -- Number of times the song has been played
    FOREIGN KEY (music_id) REFERENCES MusicApp.dbo.MusicList(id) 
    ON DELETE CASCADE                           -- 当 MusicList 表中的歌曲删除时，删除该歌曲的评论
);
 ```

 ### 4. 最近播放 (`MusicApp.dbo.MusicRecentlyPlayed`)

 ```
CREATE TABLE MusicApp.dbo.MusicRecentlyPlayed (
    id INT IDENTITY(1,1) PRIMARY KEY,        -- 
    music_id INT NOT NULL,              -- 音乐 ID，外键引用 Music 表的 id 
    email NVARCHAR(100) NOT NULL,       -- 用户邮箱
    title NVARCHAR(255) NOT NULL,            -- 音乐标题，最大字符数 255
    artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    coverimage NVARCHAR(255),                -- 封面图像路径，最大字符数 255
    src NVARCHAR(255) NOT NULL,              -- 音乐文件源路径，最大字符数 255
    genre NVARCHAR(50),                      -- 歌曲类型（欧美、华语、韩语、其他等），最大字符数 50
    playtime DATETIME DEFAULT GETDATE()      -- 默认当前时间
    FOREIGN KEY (music_id) REFERENCES MusicApp.dbo.MusicList(id) 
    ON DELETE CASCADE                           -- 当 MusicList 表中的歌曲删除时，删除该歌曲的评论
);
 ```

 ### 5. 一起听-音乐房间表 (`MusicApp.dbo.MusicListenTogetherRooms`)

 ```  一起听歌 REACTDEMO 音乐房间表
CREATE TABLE MusicApp.dbo.MusicListenTogetherRooms (
    id INT IDENTITY(1,1) PRIMARY KEY,          -- 房间ID，主键，自增长
    room_name NVARCHAR(100) UNIQUE,         -- 房间名称，必须唯一
    password NVARCHAR(100),                          -- 房间密码，若有则设置密码
    host NVARCHAR(100) NOT NULL,                     -- 房主（创建者）名称 
    max_users INT NOT NULL DEFAULT 10,               -- 房间的最大用户数，默认为10
    title NVARCHAR(255) NOT NULL DEFAULT 'Hurt',            -- 音乐标题，最大字符数 255
    artist NVARCHAR(255) NOT NULL DEFAULT 'Johnny Cash',           -- 艺术家/歌手，最大字符数 255
    coverimage NVARCHAR(255) NOT NULL DEFAULT 'Hurt-Johnny Cash.jpg',                -- 封面图像路径，最大字符数 255
    src NVARCHAR(255)  NOT NULL DEFAULT 'Hurt-Johnny Cash.mp3',              -- 音乐文件源路径，最大字符数 255
    genre NVARCHAR(50) NOT NULL DEFAULT '欧美',                      -- 歌曲类型（欧美、华语、韩语、其他等），最大字符数 50
    is_playing BIT DEFAULT 0,                        -- 当前是否正在播放，0 表示不在播放，1 表示正在播放
    play_mode NVARCHAR(50) DEFAULT 'order',        -- 播放模式，默认值为 '顺序播放'
    created_at DATETIME NOT NULL DEFAULT GETDATE(),   -- 房间创建时间，默认当前时间
    [current_time] FLOAT DEFAULT 0,                  -- 当前播放的时间点，单位为秒，默认值为0
    room_status NVARCHAR(50) NOT NULL DEFAULT '等待中', -- 房间状态，默认值为 '等待中'，表示房间当前状态（例如：等待中、进行中等）
    queue NVARCHAR(MAX) NULL,       -- 添加 queue 字段来存储歌单（使用 NVARCHAR(MAX)）
);
 ``` 

 ### 6. 一起听-房间用户表 (`MusicApp.dbo.MusicListenTogetherRoomUsers`)

 ``` 
CREATE TABLE MusicApp.dbo.MusicListenTogetherRoomUsers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    room_name NVARCHAR(100) NOT NULL,   -- 房间名称 
    email NVARCHAR(100) NOT NULL,       -- 用户邮箱
    is_host BIT NOT NULL DEFAULT 0,      -- 是否是房主
    join_time DATETIME NOT NULL DEFAULT GETDATE(),  -- 加入时间
    CONSTRAINT UQ_MusicRoomUsers_RoomUser UNIQUE (room_name, email),
    FOREIGN KEY (room_name) REFERENCES MusicApp.dbo.MusicListenTogetherRooms(room_name) ON DELETE CASCADE    -- 外键约束
);
 ```

 ### 7. 一起听-房间消息 (`MusicApp.dbo.MusicListenTogetherRoomMessages`)

 ``` 
CREATE TABLE MusicApp.dbo.MusicListenTogetherRoomMessages (
    id INT IDENTITY(1,1) PRIMARY KEY,               -- 消息ID，主键，自增长
    room_name NVARCHAR(100) NOT NULL,                -- 房间名称，外键，关联 MusicRooms 表的 room_name 字段
    email NVARCHAR(100) NOT NULL,       -- 用户邮箱
    message NVARCHAR(1000) NOT NULL,                 -- 消息内容，最大长度为 1000 字符
    sent_at DATETIME NOT NULL DEFAULT GETDATE(),     -- 消息发送时间，默认当前时间
    FOREIGN KEY (room_name) REFERENCES MusicApp.dbo.MusicListenTogetherRooms(room_name) 
        ON DELETE CASCADE                            -- 外键约束，删除 MusicApp.dbo.MusicListenTogetherRooms 中的房间时，自动删除该房间的所有消息
);
 ```
---
##  二、记账板块数据库 (`AccountingApp`)

### 1. 账单 (`AccountingApp.dbo.AccountingList`)

 ``` 
CREATE TABLE AccountingApp.dbo.AccountingList (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,     -- 交易ID，唯一标识
    transaction_date DATE NOT NULL,                -- 交易时间
    amount DECIMAL(18, 2) NOT NULL,                    -- 交易金额，使用DECIMAL类型来确保精度
    transaction_type NVARCHAR(50) NOT NULL,            -- 交易类型 (收入 / 支出)
    category NVARCHAR(100),                            -- 交易类别 (例如: 食品, 交通, 工资等)
    payment_method NVARCHAR(50),                       -- 支付方式 (现金、银行卡、支付宝、微信等)
    description NVARCHAR(255),                         -- 交易描述 (详细说明)
    created_by NVARCHAR(100) NOT NULL,                 -- 记录创建人
    note NVARCHAR(MAX),                                 -- 额外备注或说明
    created_date DATETIME DEFAULT GETDATE(),          -- 记录创建时间 (默认当前时间)
    updated_by NVARCHAR(100),                          -- 最近更新记录的人
    updated_date DATETIME,                             -- 最近更新时间
);
 ``` 
> **设计建议**：此表数据量大，建议按月份分区或使用存储。
---

##  三、聊天板块数据库 (`WeChatApp`)

### 1. 用户管理 (`WeChatApp.dbo.WeChatUserManagement`)
 ``` 
CREATE TABLE WeChatApp.dbo.WeChatUserManagement (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 用户ID，自动递增
    username NVARCHAR(50) NOT NULL,     -- 用户账号
    gender VARCHAR(10);  -- 新增性别字段，使用VARCHAR类型，最大长度为10
    password NVARCHAR(100) NULL,    -- 用户密码
    friend NVARCHAR(50),                -- 好友账号，可以为空
    friend_ip VARCHAR(15),              -- 好友IP地址，使用VARCHAR类型，最大长度为15
    is_friend_request_accepted BIT,      -- 是否同意好友请求，1为同意，0为不同意
    is_show_request BIT DEFAULT 1,  -- 默认值设为 1，表示默认显示请求
    friend_nickname NVARCHAR(50),       -- 好友备注昵称字段，长度可根据需要调整
);
 ``` 

 ### 2. 聊天消息 (`WeChatApp.dbo.WeChatMessages`)
  ``` 
 CREATE TABLE WeChatApp.dbo.WeChatMessages (
    message_id BIGINT IDENTITY(1,1) PRIMARY KEY,          -- 唯一标识符，自增，主键
    message_text TEXT,                                     -- 消息内容
    sender_name VARCHAR(100) NOT NULL,                      -- 发送者的用户名
    receiver_name VARCHAR(100) NOT NULL,                    -- 接收者的用户名
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,           -- 消息发送时间戳
    is_read BIT DEFAULT 0,  -- 新增是否已读字段，默认值为 0（未读）
    message_type VARCHAR(50) DEFAULT 'text',  -- 消息类型，默认是文字类型
    image_filename VARCHAR(255) NULL,          -- 图片文件名，允许为空，存储图片文件名
    roomId INT NULL,   -- 视频房间号
);
 ``` 

### 3. 视频房间号 (`WeChatApp.dbo.WeChatRoomNumber`)
 ``` 
 CREATE TABLE WeChatApp.dbo.WeChatRoomNumber (
    roomId BIGINT IDENTITY(1,1) PRIMARY KEY,          -- 唯一标识符，自增，主键
    sender_name VARCHAR(100) NOT NULL,                      -- 发送者的用户名
    receiver_name VARCHAR(100) NOT NULL,                    -- 接收者的用户名
);
 ``` 
 
 ### 4. 聊天主题设置 (`WeChatApp.dbo.WeChatThemeSettings`)
``` 
 CREATE TABLE WeChatApp.dbo.WeChatThemeSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自增长字段，初始值为 1，每次增加 1
    username NVARCHAR(50) NOT NULL,     -- 用户名，限制最大长度为 50 个字符
    password NVARCHAR(255) NOT NULL,    -- 密码，限制最大长度为 255 个字符
    login_time DATETIME NOT NULL DEFAULT GETDATE(),  -- 登录时间，默认为当前时间
    ip_address NVARCHAR(50),            -- 用户登录时的 IP 地址，长度为 50
    status NVARCHAR(20) DEFAULT 'active',   -- 状态，默认为 'active'
     -- 主题设置相关字段
    their_font_color NVARCHAR(7) DEFAULT '#000000',  -- 对方字体颜色，默认黑色
    their_bubble_color NVARCHAR(7) DEFAULT '#D3D3D3',  -- 对方对话框颜色，默认灰色
    my_font_color NVARCHAR(7) DEFAULT '#000000',  -- 我的字体颜色，默认黑色
    my_bubble_color NVARCHAR(7) DEFAULT '#90EE90',  -- 我的对话框颜色，默认白色
    background_color NVARCHAR(7) DEFAULT '#F0F0F0',  -- 背景颜色，默认浅灰色
    use_background_image BIT DEFAULT 0,  -- 是否启用背景图片，默认不启用
    navbar_font_color NVARCHAR(7) DEFAULT '#FFFFFF',  -- 导航栏字体颜色，默认白色
    navbar_background_color NVARCHAR(7) DEFAULT '#32502c',   -- 导航栏背景颜色，默认 #32502c   
);
``` 
---

## 四、系统设置板块数据库 (`SystemSettingsApp`)
 ### 1. 用户设置 (`SystemSettingsApp.dbo.SystemUserAccounts`)
``` 
CREATE TABLE SystemSettingsApp.dbo.SystemUserAccounts (
    id INT IDENTITY(1,1) PRIMARY KEY,         -- 用户ID，自增
    username NVARCHAR(100) NOT NULL,          -- 用户姓名
    email NVARCHAR(100) NOT NULL UNIQUE,       -- 用户邮箱，唯一
    password NVARCHAR(255) NOT NULL,           -- 用户密码，存储加密后的密码
    registration_date DATETIME DEFAULT GETDATE(),  -- 用户注册时间，默认为当前时间
    last_login_time DATETIME DEFAULT GETDATE(),    -- 最后登录时间
    profile_picture NVARCHAR(255),             -- 头像图片链接
    permission_level NVARCHAR(50) DEFAULT 0,    -- 权限级别，例如管理员、普通用户、VIP等 
    notes NVARCHAR(500),                       -- 管理员备注信息
    is_locked BIT DEFAULT 0,                    -- 账户锁定状态，默认为0（未锁定）
);
``` 
 ### 2. 系统主题设置 (`SystemSettingsApp.dbo.SystemUserThemeSettings`)
``` 
CREATE TABLE SystemSettingsApp.dbo.SystemUserThemeSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    theme_name NVARCHAR(100) DEFAULT '默认主题',
    -- ===== 背景色 =====
    background_color NVARCHAR(9) DEFAULT '#FFFFFFFF',           -- 背景色
    secondary_background_color NVARCHAR(9) DEFAULT '#F8F9FAFF', -- 次要背景色
    hover_background_color NVARCHAR(9) DEFAULT '#E9ECEEFF',     -- 悬停背景色
    focus_background_color NVARCHAR(9) DEFAULT '#DEE2E6FF',     -- 焦点背景色
    -- ===== 字体颜色 =====
    font_color NVARCHAR(9) DEFAULT '#000000FF',                -- 主要字体颜色
    secondary_font_color NVARCHAR(9) DEFAULT '#6C757DFF',      -- 次要字体颜色
    hover_font_color NVARCHAR(9) DEFAULT '#0078D4FF',          -- 悬停字体颜色
    focus_font_color NVARCHAR(9) DEFAULT '#0056B3FF',          -- 焦点字体颜色
    watermark_font_color NVARCHAR(9) DEFAULT '#B3B5B6FF',      -- 水印字体颜色
    font_family NVARCHAR(255) DEFAULT 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', -- 字体族
    -- ===== 边框颜色 =====
    border_color NVARCHAR(9) DEFAULT '#DEE2E6FF',              -- 主要边框颜色
    secondary_border_color NVARCHAR(9) DEFAULT '#E9ECEEFF',    -- 次要边框颜色
    hover_border_color NVARCHAR(9) DEFAULT '#0078D4FF',        -- 悬停边框颜色
    focus_border_color NVARCHAR(9) DEFAULT '#0056B3FF',        -- 焦点边框颜色
    -- ===== 阴影颜色 =====
    shadow_color NVARCHAR(9) DEFAULT '#00000019',              -- 阴影颜色
    hover_shadow_color NVARCHAR(9) DEFAULT '#00000026',        -- 悬停阴影颜色
    focus_shadow_color NVARCHAR(9) DEFAULT '#0078D440',        -- 焦点阴影颜色
    is_active BIT DEFAULT 0,        -- 默认不启用激活
    background_animation NVARCHAR(100) DEFAULT 'DarkClouds',  -- 背景特效
    -- 外键约束：关联到 userAccounts 表的 email 字段
    FOREIGN KEY (email) REFERENCES SystemSettingsApp.dbo.SystemUserAccounts(email) 
        ON DELETE CASCADE, -- 外键约束    如果用户被删除，相关的主题设置也删除  
);
``` 

 