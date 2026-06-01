
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
| **SystemSettingsApp** | 系统 | 系统相关设置 |
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

##  二、聊天板块数据库 (`WeChatApp`)

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

##  三、办公协作板块数据库 (`OfficeApp`)
### 1. 报告编写预设选项 (`OfficeApp.dbo.WordReportOptions`)
 ``` 
CREATE TABLE OfficeApp.dbo.WordReportOptions (
    ID INT IDENTITY(1,1) PRIMARY KEY,               -- 自增主键
    AppraiserNameOptions VARCHAR(50),                -- 估价师名称（选项），可以为空
    RegistrationNumberOptions VARCHAR(255),           -- 注册号（选项值），可以为空
    housePurposeOptions VARCHAR(255),            -- 房屋用途（选项值）可以为空
    houseStructureOptions VARCHAR(255),            -- 房屋结构（选项值）可以为空
    coOwnershipStatusOptions VARCHAR(255),            -- 共有情况（选项值）可以为空
    landPurposeOptions VARCHAR(255),            -- 土地用途（选项值）可以为空
    rightsNatureOptions VARCHAR(255),            -- 权利性质（选项值）可以为空
    exteriorWallMaterialOptions VARCHAR(255),            -- 外墙面（选项值）可以为空
    valuationMethodOptions VARCHAR(255)            -- 估价方法（选项值）可以为空
    assessmentCommissionDocumentOptions VARCHAR(500) -- 
    valueDateRequirementsOptions VARCHAR(500)           -- 
    landShapeOptions VARCHAR(500) -- 土地形状
    orientationOptions VARCHAR(500) -- 朝向
    parkingStatusOptions VARCHAR(500) -- 停车
    mortgageBasisOptions VARCHAR(500) -- 抵押依据
    seizureBasisOptions VARCHAR(500) -- 查封依据
    utilizationStatusOptions VARCHAR(500) -- 利用现状
);
 ```
 
 ### 2. 报告信息库 (`OfficeApp.dbo.WordReportsInformation`)
 ``` 
CREATE TABLE OfficeApp.dbo.WordReportsInformation (
    reportsID INT IDENTITY(1,1) PRIMARY KEY,         -- ID，主键，自动增长
    documentNo VARCHAR(100) NOT NULL,               -- 委托书编号 可以存储字母、数字或特殊字符
    entrustDate DATE NOT NULL,                      -- 委托日期
    entrustingParty VARCHAR(200) NOT NULL,          -- 委托方
    location VARCHAR(500) NOT NULL,                 -- 房产坐落
    buildingArea DECIMAL(10, 2) NOT NULL,           -- 建筑面积，精度为 10 位数，保留 2 位小数
    interiorArea DECIMAL(10, 2) NOT NULL,           -- 套内面积，精度为 10 位数，保留 2 位小数
    valueDate DATE NOT NULL,                        -- 价值时点
    reportDate DATE NOT NULL,                       -- 报告日期
    appraiserNameA VARCHAR(100) NOT NULL,           -- 估价师 A 姓名
    appraiserRegNoA VARCHAR(100) NOT NULL,          -- 估价师 A 注册号
    appraiserNameB VARCHAR(100) NOT NULL,           -- 估价师 B 姓名
    appraiserRegNoB VARCHAR(100) NOT NULL,          -- 估价师 B 注册号
    communityName VARCHAR(200) NOT NULL,             -- 小区名称
    totalFloors INT NOT NULL,                       -- 总层数
    floorNumber NVARCHAR(50) NOT NULL,              -- 所在楼层
    housePurpose VARCHAR(200) NOT NULL,             -- 房屋用途
    propertyUnitNo VARCHAR(100) NOT NULL,           -- 不动产单元号
    rightsHolder VARCHAR(200) NOT NULL,             -- 权利人
    landPurpose VARCHAR(200) NOT NULL,              -- 土地用途
    sharedLandArea DECIMAL(10, 2) NOT NULL,         -- 共有宗地面积
    landUseRightEndDate DATE NOT NULL,              -- 土地使用权终止日期
    houseStructure VARCHAR(200) NOT NULL,           -- 房屋结构
    coOwnershipStatus VARCHAR(200) NOT NULL,        -- 共有情况
    rightsNature VARCHAR(100) NOT NULL,             -- 权利性质（出让、划拨）
    elevator BIT NOT NULL,                          -- 电梯（有、无）
    decorationStatus VARCHAR(1000) NOT NULL,        -- 装饰装修
    ventilationStatus BIT NOT NULL,                 -- 通气（是、否）
    spaceLayout VARCHAR(200) NOT NULL,              -- 空间布局
    exteriorWallMaterial VARCHAR(200) NOT NULL,     -- 外墙面
    yearBuilt INT NOT NULL,                         -- 建成年份
    boundaries VARCHAR(500) NOT NULL,               -- 四至
    valuationMethod VARCHAR(200) NOT NULL,          -- 估价方法
    propertyCertificateNo VARCHAR(100) NOT NULL,    -- 产权证号
    projectID VARCHAR(100) NOT NULL,                -- 项目编号
    reportID VARCHAR(100) NOT NULL,                 -- 报告编号
    valuationPrice DECIMAL(15, 0) NOT NULL,         -- 评估单价 (没有小数)
    assessmentCommissionDocument VARCHAR(500) NOT NULL,  -- 评估委托文书（选项值）
    hasFurnitureElectronics BIT NOT NULL DEFAULT 0, -- 是否包含家具家电，默认值为 0（即否）
    furnitureElectronicsEstimatedPrice DECIMAL(6, 0) NOT NULL,  -- 家具家电评估总价，整数类型
    valueDateRequirements VARCHAR(1000) NOT NULL,   -- 价值时点要求
    landShape VARCHAR(1000) NULL,                  -- 土地形状
    streetStatus VARCHAR(1000) NULL,               -- 临街状况
    direction VARCHAR(1000) NULL,                 -- 方位
    orientation VARCHAR(1000) NULL,               -- 朝向
    distance VARCHAR(1000) NULL,                  -- 距离
    parkingStatus VARCHAR(1000) NULL,             -- 停车状况
    mortgageStatus BIT NULL DEFAULT 1,            -- 抵押状况 默认是1
    mortgageBasis VARCHAR(1000) NULL,             -- 抵押依据
    seizureStatus BIT NULL DEFAULT 1,              -- 查封状况 默认是1
    seizureBasis VARCHAR(1000) NULL,              -- 查封依据
    utilizationStatus VARCHAR(1000) NULL,         -- 利用状况
    isLeaseConsidered BIT NULL DEFAULT 0,         -- 是否考虑租约（1 = 是，0 = 否） 默认是0
    rent DECIMAL(18, 2) NOT NULL DEFAULT 0.00,    -- 租金字段，类型为 DECIMAL，默认值为 0.00
    bank VARCHAR(500) NULL,                       -- 附近银行
    supermarket VARCHAR(1000) NULL,               -- 附近超市
    hospital VARCHAR(1000) NULL,                  -- 附近医院
    school VARCHAR(1000) NULL,                    -- 附近学校
    nearbyCommunity VARCHAR(1000) NULL,           -- 附近小区
    busStopName VARCHAR(1000) NULL,               -- 附近公交站名
    busRoutes VARCHAR(1000) NULL,                 -- 附近公交线路
    areaRoad VARCHAR(1000) NULL                   -- 附近区域道路
);
 ``` 

### 3. 评估报告附件装订pdf用户管理 (`OfficeApp.dbo.PdfPrintFileCompanyPersonnel`)
 ``` 
CREATE TABLE OfficeApp.dbo.PdfPrintFileCompanyPersonnel (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- ID，主键
     companyName NVARCHAR(100) NOT NULL DEFAULT 'ruida',  -- 新增：公司名称，非空且默认值为'ruida'
   username NVARCHAR(50) NOT NULL,     -- 用户名，限制最大长度为 50 个字符
   email NVARCHAR(100) NOT NULL,       -- 用户邮箱           
);
 ``` 

 ### 4. 评估报告附件装订pdf文件表 (`OfficeApp.dbo.ReportPdfPrintFile`)
``` 
CREATE TABLE OfficeApp.dbo.ReportPdfPrintFile (
    pdfPrintFileId INT IDENTITY(1,1) PRIMARY KEY,  -- ID，主键
     companyName NVARCHAR(100) NOT NULL DEFAULT 'ruida',  -- 新增：公司名称，非空且默认值为'ruida'
    fileType NVARCHAR(50) NOT NULL DEFAULT '房地产',        -- 文件类型，默认值为 '房地产'
    pdfPrintFileName NVARCHAR(100) NOT NULL,         -- PDF文件名
    paperSize NVARCHAR(10) NOT NULL DEFAULT 'A4',           -- 纸张大小，默认值为 A4
    effectiveDate DATE NOT NULL DEFAULT GETDATE(),          -- 有效期字段（日期类型），默认值为当前日期
    notes NVARCHAR(MAX) NULL                                 -- 备注，允许为空
);
``` 
 ### 5. pdf资料文件表 (`OfficeApp.dbo.EvaluationFilePreview`)
 ``` 
CREATE TABLE OfficeApp.dbo.EvaluationFilePreview (
    FileID INT IDENTITY(1,1) PRIMARY KEY,      -- 文件ID，主键
    CategoryName NVARCHAR(100) NOT NULL,        -- 分类名称
    FileName NVARCHAR(255) NOT NULL,            -- 文件名
    Remarks NVARCHAR(255),                      -- 备注
);
``` 
 ### 5. 创建新的报告下载表 (`OfficeApp.dbo.EvaluationFilePreview`)
 ``` 
CREATE TABLE OfficeApp.dbo.TemplateManagement (
    Id INT PRIMARY KEY IDENTITY(1,1),  -- 主键，自增标识
    AssetType NVARCHAR(50) NOT NULL,  -- 资产类型（非空）
    AssetTypeRemark NVARCHAR(255) NULL,  -- 资产类型备注（可为空
    ValuationPurpose NVARCHAR(50) NOT NULL,  -- 估价目的（非空）
    DocumentName NVARCHAR(100) NOT NULL,  -- 文档名称（非空）
    DocumentRemark NVARCHAR(255) NULL  -- 文档备注（可为空）
);
 ``` 

### 6. 消息通知 (`OfficeApp.dbo.MessageDetail`)
 ``` 
CREATE TABLE OfficeApp.dbo.MessageDetail (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自动递增的主键
    title NVARCHAR(255) NOT NULL,       -- 消息标题，最大长度 255
    time DATETIME NOT NULL,             -- 消息发布时间
    content NVARCHAR(MAX)               -- 消息内容，支持大量文本和换行
);
 ``` 
 ### 7. 常用网站 (`OfficeApp.dbo.UsedWebsites`)
  ``` 
 CREATE TABLE OfficeApp.dbo.UsedWebsites (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自动递增的唯一标识符
    type NVARCHAR(100),                 -- 网站类型 (如：房地产、资产、苗木、土地、娱乐)，长度可以根据实际需求调整
    name NVARCHAR(255),                 -- 网站名，长度可根据需要调整
    url NVARCHAR(500)                   -- 网站链接，长度可以根据需要调整
);
 ``` 
 ### 8. 特别通知 (`OfficeApp.dbo.Special_Tips`)
  ``` 
CREATE TABLE OfficeApp.dbo.Special_Tips (
    id INT IDENTITY(1,1) PRIMARY KEY,         -- 自动递增的唯一标识符
    asset_type NVARCHAR(100) NOT NULL,         -- 资产类型(房地产、资产、土地、其他），最大长度 100 字符
    tip_content NVARCHAR(1000) NOT NULL,       -- 提示内容，最大长度 255 字符
    remark NVARCHAR(500) NULL                 -- 备注，最大长度 500 字符，允许为空
);
 ``` 
### 9. 房价查询图片表 (`OfficeApp.dbo.HousePricePicture`)
``` 
CREATE TABLE OfficeApp.dbo.HousePricePicture (
    pictureId INT IDENTITY(1,1) PRIMARY KEY,         -- 图片ID，主键，自增长
    pictureFileName NVARCHAR(100) NOT NULL,          -- 图片文件名
    reportsID INT NOT NULL,                          -- 必须添加这个外键字段！！！
    FOREIGN KEY (reportsID) REFERENCES OfficeApp.dbo.WordReportsInformation(reportsID) 
        ON DELETE CASCADE                            -- 外键约束
);
``` 
### 10. 地图找房Api (`OfficeApp.dbo.ApiDatabas`)
``` 
CREATE TABLE OfficeApp.dbo.ApiDatabas (
    id INT IDENTITY(1,1) PRIMARY KEY,      -- 文件ID，主键
    apiUsername  VARCHAR(255) NOT NULL,        -- 用户
    apiName  VARCHAR(255) NOT NULL,        -- API名称
    apiKey  VARCHAR(255) NOT NULL,        -- API密钥   
    remark  VARCHAR(255) NOT NULL,   -- 备注
);
``` 
### 11. 构筑物价格查询表 (`OfficeApp.dbo.BuildingsPrice`)
``` 
CREATE TABLE OfficeApp.dbo.BuildingsPrice (
    buildingsPriceid INT IDENTITY(1,1) PRIMARY KEY,  -- ID，主键
    name NVARCHAR(100) NOT NULL,                     -- 名称
    structure NVARCHAR(100),                         -- 结构
    area NVARCHAR(100),                              -- 区域
    unit NVARCHAR(50),                               -- 单位
    price NVARCHAR(50),                              -- 价格
createdDate DATE NOT NULL DEFAULT GETDATE(),      -- 日期字段，默认当前日期
    notes NVARCHAR(MAX)                              -- 备注
);
``` 
### 12. 构筑物价格图片查询表 (`OfficeApp.dbo.BuildingsPricePicture`)
``` 
CREATE TABLE OfficeApp.dbo.BuildingsPricePicture (
    pictureId INT IDENTITY(1,1) PRIMARY KEY,       -- 图片ID，主键，自增长
    pictureFileName NVARCHAR(100) NOT NULL,         -- 图片文件名
    buildingsPriceid INT NOT NULL,                  -- 外键字段，关联 BuildingsPrice 表
    FOREIGN KEY (buildingsPriceid) REFERENCES OfficeApp.dbo.BuildingsPrice(buildingsPriceid) 
        ON DELETE CASCADE                          -- 外键约束，级联删除
);
``` 
### 13. 苗木查询表 (`OfficeApp.dbo.TreeDB`)
``` 
CREATE TABLE OfficeApp.dbo.TreeDB (
    id INT IDENTITY(1,1) PRIMARY KEY,      -- ID，主键
    name VARCHAR(255) NOT NULL,             -- 名称
    diameter DECIMAL(5,2),                  -- 米经
    height DECIMAL(5,2),                    -- 高度
    crown_width DECIMAL(5,2),               -- 冠幅
    ground_diameter DECIMAL(5,2),           -- 地径
    price DECIMAL(10,2),                    -- 价格
    region VARCHAR(255),                    -- 区域
    species VARCHAR(255),                   -- 种类
    notes TEXT                              -- 备注
);
``` 
### 14. 机器设备查询表 (`OfficeApp.dbo.MachineryEquipmentPricesTable`)
``` 
CREATE TABLE OfficeApp.dbo.MachineryEquipmentPricesTable (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- 自动递增的唯一标识符（主键）
    name NVARCHAR(100) NOT NULL,         -- 设备名称，字符串类型，最大长度为100
    model NVARCHAR(100) NOT NULL,        -- 规格型号，字符串类型，最大长度为100
    manufacturer NVARCHAR(100) NOT NULL, -- 品牌，字符串类型，最大长度为100
    unit NVARCHAR(50) NOT NULL,          -- 单位，字符串类型，最大长度为50
    price DECIMAL(18, 2) NOT NULL        -- 价格，数值类型，保留两位小数
);
``` 
### 15. 二维码解码映射表 (`OfficeApp.dbo.ReportqrCodepageDecodeMapping`)
``` 
CREATE TABLE OfficeApp.dbo.ReportqrCodepageDecodeMapping (
    Id INT IDENTITY(1,1) PRIMARY KEY,  -- 自增主键
    OriginalValue INT NOT NULL,             -- 需要解码的数据 (0-9)
    DecodedText NVARCHAR(255) NOT NULL, -- 解码后的文本
    Description NVARCHAR(500),          -- 可选：描述信息
);
0 → Ks71 
1→ p2G2 
2→ 9zR3 
3→ Fd54 
4→ q8S5 
5→ Bn36 
6→ xT17 
7→ mJ98 
8→ Lv49 
9→ cH6
``` 

### 15. 评估工作留言 (`OfficeApp.dbo.EvaluationBusinessMessage`)
``` 
CREATE TABLE OfficeApp.dbo.EvaluationBusinessMessage ( 
    id INT IDENTITY(1,1) PRIMARY KEY,-- 问题ID (主键)，使用自增整数类型，确保唯一性 
    requestername NVARCHAR(50) NOT NULL,-- 提问人姓名，可变字符类型，长度50足够存储姓名 
    contact NVARCHAR(50) NULL,-- 联系方式，可变字符类型，长度20可存储手机号/座机号等 
    description NVARCHAR(MAX) NOT NULL,-- 问题描述，文本类型存储较长内容 
    isread BIT DEFAULT(0) NOT NULL,-- 是否已读，BIT类型（0=未读，1=已读），默认值0
    submitted DATETIME DEFAULT(GETDATE()) NOT NULL,-- 提交时间，日期时间类型，默认值为当前时间
    responded DATETIME NULL, -- 回复时间，日期时间类型，可空（未回复时为NULL）
    ip_address NVARCHAR(45) NULL,        -- 存储客户端IP地址
);
``` 
### 16. 评估动态新闻 (`OfficeApp.dbo.PublishNews`)
``` 
CREATE TABLE OfficeApp.dbo.PublishNews (
    Id INT IDENTITY(1,1) PRIMARY KEY,                    -- 主键，自增
    Title NVARCHAR(200) NOT NULL,                        -- 标题，不能为空
    Category NVARCHAR(50) NOT NULL,                      -- 分类  公司新闻、行业动态、政策法规
    Content NVARCHAR(MAX),                               -- 正文内容 (预留)
    ImageUrl NVARCHAR(255) DEFAULT 'Defaultbackground.jpg',                   -- 图片路径 Defaultbackground.jpg
    PublishDate DATE DEFAULT GETDATE(),        -- 发布日期 默认当前日期                
    ViewCount INT DEFAULT 50,                             -- 浏览量，默认50
    IsActive BIT DEFAULT 1,                              -- 是否显示，默认显示
    UpdatedAt DATE DEFAULT GETDATE()                 -- 更新时间
);
``` 

##  四、记账板块数据库 (`AccountingApp`)

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

### 2. 账单选项 (`AccountingApp.dbo.AccountingOptions`)

 ``` 
CREATE TABLE AccountingApp.dbo.AccountingOptions (
    id INT IDENTITY(1,1) PRIMARY KEY,     -- 交易ID，唯一标识
    transactiontypeOptions NVARCHAR(50),            -- 交易类型 (收入 / 支出)
    categoryOptions NVARCHAR(100),                  -- 交易类别 (例如: 购物 娱乐 交通 餐饮)
    categoryunicodeOptions  VARCHAR(MAX),          -- 交易类别图标的Unicode表示（现在可以存储更长的文本）
    paymentmethodOptions NVARCHAR(50),                       -- 支付方式 (现金、银行卡、支付宝、微信等)
);
 ``` 
---


## 五、运动板块数据库 (`SportsAppApp`)

## 六、系统设置板块数据库 (`SystemSettingsApp`)

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
    device_id NVARCHAR(255),                   -- 登录客户端生成的唯一设备ID
    device_type NVARCHAR(50)                   -- 设备类型：pc、mobile、tablet、android、ios
);
``` 

 ### 2. 用户API设置 (`SystemSettingsApp.dbo.SystemUserApi`)
``` 
CREATE TABLE SystemSettingsApp.dbo.SystemUserApi (
    id INT IDENTITY(1,1) PRIMARY KEY,         -- 用户ID，自增
    email NVARCHAR(100) NOT NULL UNIQUE,       -- 用户邮箱，唯一
    purpose NVARCHAR(200) NULL,                 -- 用途
    API_URL NVARCHAR(255) NULL,               -- 接口地址
    TOKEN NVARCHAR(255) NULL,                  -- 令牌
      remark NVARCHAR(500) NULL                 -- 备注
    FOREIGN KEY (email) REFERENCES SystemSettingsApp.dbo.SystemUserAccounts(email) 
        ON DELETE CASCADE                            -- 外键约束，删除 SystemSettingsApp.dbo.SystemUserAccounts 中的email时，自动删除该email的所有消息
);
``` 

 ### 3. 系统主题设置 (`SystemSettingsApp.dbo.SystemUserThemeSettings`)
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
### 4. 系统主题设置数据库表 (`SystemSettingsApp.dbo.SystemThemeDB`)
``` 好像是聊天的主题
CREATE TABLE SystemSettingsApp.dbo.SystemThemeDB (
    id INT IDENTITY(1,1) PRIMARY KEY,      -- ID，主键
    username nvarchar(100) NOT NULL,             -- 用户名
    fontColor NVARCHAR(9) DEFAULT '#000000FF',  -- 字体颜色，默认黑色，完全不透明
    background NVARCHAR(9) DEFAULT '#ffffffFF',  -- 背景颜色，默认白色，完全不透明   
    borderBrush NVARCHAR(9) DEFAULT '#efefefFF',  -- 黑色边框，完全不透明
    hoverBorderBrush NVARCHAR(9) DEFAULT '#000000FF',  -- 悬浮边框颜色，黑色，完全不透明
    hoverBackground NVARCHAR(9) DEFAULT '#cdcecfFF',  -- 悬浮背景颜色，完全不透明
    hoverFontColor NVARCHAR(9) DEFAULT '#000000FF',  -- 悬浮字体颜色，完全不透明
    watermarkForeground NVARCHAR(9) DEFAULT '#b3b5b6FF',  -- 占位符（placeholder）字体颜色，完全不透明
    fontFamily VARCHAR(255) DEFAULT 'Arial',  -- 字体家族
    backgroundAnimation VARCHAR(100) DEFAULT 'WaterWave'
);
``` 
### 5. 网站访客监控 (`SystemSettingsApp.dbo.WebsiteRecord`)
``` 
CREATE TABLE SystemSettingsApp.dbo.WebsiteRecord (
    -- 1. 主键
    id INT IDENTITY(1,1) PRIMARY KEY,
    -- 2. 核心标识字段 (用于计算 UV 和去重)
    visitorid NVARCHAR(64) NOT NULL,       -- 客户端生成的唯一ID (如 UUID/Fingerprint)，用于计算 UV
    sessionid NVARCHAR(64) NOT NULL,       -- 会话ID (同一会话内多次请求ID相同)，用于计算 Sessions 和 跳出率
    ipaddress NVARCHAR(45) NOT NULL,       -- 用户IP (支持IPv6)，用于计算 IP数 和地域分析   
    username NVARCHAR(100) NOT NULL DEFAULT 'unknowusername',          -- 用户姓名
    email NVARCHAR(100) NOT NULL DEFAULT 'unknowemail',       -- 用户邮箱，唯一
    -- 3. 时间字段 (用于时间范围筛选和时长计算)
    visittime DATETIME2 NOT NULL DEFAULT GETDATE(), -- 访问发生的具体时间
    pageloadtime INT,                     -- 页面加载耗时(毫秒)，可选，用于性能分析   
    -- 4. 页面与来源字段 (用于统计 PV, 来路, 入口, 受访)
    currenturl NVARCHAR(2048) NOT NULL,    -- 当前访问的页面 URL (受访页)
    referrerurl NVARCHAR(900),            -- 来源 URL (HTTP Referer)，用于统计“来路”
    entryurl NVARCHAR(2048),               -- 本次会话的入口 URL (通常在会话第一条记录时写入，或后端推导) 
    -- 5. 设备与环境信息 (可选，用于未来扩展分析)
    useragent NVARCHAR(1024),              -- 浏览器 UA，用于解析设备类型(OS, Browser)
    countrycode CHAR(2),                   -- 国家代码 (可通过IP库解析后存入)
    cityname NVARCHAR(100),                -- 城市名称  
    -- 6. 行为标记 (用于优化查询性能)
    isbounce BIT DEFAULT 1,                -- 是否跳出 (1:是, 0:否)。后端在会话结束时更新此字段
    stayduration INT                       -- 在该页面的停留时长(秒)。如果是单页应用或最后一步，需特殊计算
    -- 索引建议 (非常重要，否则大数据量下查询极慢)
);
-- 创建索引以加速查询
CREATE INDEX IDXVisitTime ON SystemSettingsApp.dbo.WebsiteRecord (visittime);
CREATE INDEX IDXSessionId ON SystemSettingsApp.dbo.WebsiteRecord (sessionid);
CREATE INDEX IDXVisitorId ON SystemSettingsApp.dbo.WebsiteRecord (visitorid);
CREATE INDEX IDXReferrer ON SystemSettingsApp.dbo.WebsiteRecord (referrerurl);
``` 

# 项目结构
  ```
  src/
├── components/           # 仅用于user页面的私有组件
│   ├── Layout/
│   │   ├── BottomNavLayout.js
│   │   ├── BottomNavLayout.module.css
│   │   ├── Header.js
│   │   ├── Header.module.css
│   │   ├── index.js
│   │   ├── index.module.css
│   │   ├── readme.md
│   │   ├── Sidebar.module.css
│   │   └── SidebarLayout.js
│   │   └── Header.js    
│   └── UI/              
│       ├── Button/
│       ├── Input/
│       ├── Modal/
│       └── index.js     # 统一导出
├── pages/
│    ├── modules
│    │   ├── accounting
│    │   │   ├── Overview.js
│    │   │   ├── Reports.js
│    │   │   └── Transactions.js
│    │   ├── chat
│    │   │   ├── Contacts.js
│    │   │   └── Conversations.js
│    │   ├── music
│    │   │   ├── Favorites.js
│    │   │   ├── Favorites.module.css
│    │   │   ├── Home.js
│    │   │   ├── Home.module.css
│    │   │   ├── Player.js
│    │   │   ├── Player.module.css
│    │   │   ├── Recent.js
│    │   │   ├── Recent.module.css
│    │   │   ├── Recommend.js
│    │   │   └── Recommend.module.css
│    │   ├── office
│    │   │   ├── Dashboard.js
│    │   │   ├── Docs.js
│    │   │   └── Tasks.js
│    │   └── outfit
│    │       ├── Closet.css
│    │       ├── Closet.js
│    │       ├── Combos.js
│    │       ├── mannequin.png
│    │       ├── PreviewWardrobe.css
│    │       ├── PreviewWardrobe.js
│    │       ├── UpdateWardrobe.css
│    │       ├── UpdateWardrobe.js
├── context/   # 全局状态管理（如AuthContext、ThemeContext）
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   └── index.js         # 统一导出
├── hooks/     # 自定义React Hooks 
│   ├── useAuth.js
│   ├── useForm.js
│   ├── useLocalStorage.js
│   └── index.js         # 统一导出
├── utils/               # 新增：工具函数
│   ├── api.js          # API调用封装
│   ├── constants.js    # 常量定义
│   ├── helpers.js      # 辅助函数
│   └── index.js        # 统一导出
├── services/            # 新增：API服务层
│   ├── authService.js
│   ├── userService.js
│   └── index.js        # 统一导出
├── assets/
│   ├── images/
│   │   ├── icons/
│   │   └── illustrations/
│   ├── fonts/
│   └── styles/         # 样式文件分类
│       ├── globals.css # 全局样式
│       ├── variables.css # CSS变量
│       └── mixins.css  # CSS混入
├── routes/
│   ├── index.js
│   └── ProtectedRoute.js # 路由守卫组件
├── App.js
├── App.module.css
└── index.js
  ```
 
 