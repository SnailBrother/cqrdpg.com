# 多功能集成平台数据库设计

## 📌 项目简介
本项目是一个集**聊天社交**、**音乐娱乐**、**办公协作**于一体的全栈应用平台。
以下为支撑三大业务板块的数据库分布设计说明。

---

## 🗃️ 数据库整体架构

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

## 💬 二、听歌板块数据库 (`MusicApp`)

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
 

### 3. 好友关系表 (`friendships`)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| user_id | bigint | 用户ID |
| friend_id | bigint | 好友用户ID |
| status | tinyint | 0:待确认 1:已添加 2:已拉黑 |
| created_at | datetime | 成为好友时间 |

---

## 🎵 三、听歌板块数据库 (`music_service_db`)

### 1. 歌曲基础信息表 (`songs`)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | bigint | 主键，歌曲ID |
| title | varchar(200) | 歌曲名称 |
| artist | varchar(100) | 歌手名 |
| duration | int | 时长(秒) |
| file_url | varchar(500) | 音频文件地址 |

### 2. 歌单表 (`playlists`)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | bigint | 歌单ID |
| owner_id | bigint | 创建者用户ID |
| name | varchar(50) | 歌单名称 |
| is_public | boolean | 是否公开 |

### 3. 播放历史表 (`play_history`)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| user_id | bigint | 用户ID |
| song_id | bigint | 歌曲ID |
| played_at | datetime | 播放时间 |

> **设计建议**：此表数据量大，建议按月份分区或使用 ClickHouse 存储。

---

## 📋 四、办公板块数据库 (`office_service_db`)

### 1. 在线文档表 (`documents`)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | bigint | 文档ID |
| title | varchar(200) | 文档标题 |
| owner_id | bigint | 所有者ID |
| content | longtext | 文档正文 |
| version | int | 当前版本号 |

### 2. 任务看板表 (`tasks`)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | bigint | 任务ID |
| assignee_id | bigint | 负责人ID |
| title | varchar(200) | 任务标题 |
| status | tinyint | 0:待办 1:进行中 2:已完成 |
| due_date | date | 截止日期 |

### 3. 会议预约表 (`meetings`)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | bigint | 会议ID |
| creator_id | bigint | 发起人 |
| start_time | datetime | 开始时间 |
| end_time | datetime | 结束时间 |

---

## 🔗 五、跨库关联与维护建议

### 1. 跨库数据关联逻辑
- **用户信息统一**：所有业务表 `user_id` 均指向 `user_center_db.user_base` 的 ID。
- **消息分享**：聊天中分享歌曲时，`messages.content` 字段存储 `music_service_db.songs.id`。

### 2. 部署与维护建议
#### 数据库选型
- **核心关系型数据**：MySQL 8.0+ 或 PostgreSQL。
- **海量埋点/日志数据**：ClickHouse 或 Elasticsearch。

#### 缓存策略
- **用户基础信息**：必须通过 **Redis** 缓存，减少 `user_center_db` 压力。
- **热门歌单与文档**：使用 **Redis** 缓存元数据。