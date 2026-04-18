/* #region start */

/*  #endregion end */



添加新列：

sql
ALTER TABLE ChatApp.dbo.MusicRooms
ADD play_mode NVARCHAR(50) DEFAULT 'order';
如果要修改列的默认值（假如 play_mode 列已经存在），可以使用以下语法：

sql
ALTER TABLE ChatApp.dbo.MusicRooms
ADD CONSTRAINT DF_PlayMode DEFAULT 'order' FOR play_mode;


npm install react-router-dom

添加
ALTER TABLE ChatApp.dbo.ChatMessages
ADD is_read BIT DEFAULT 0;  -- 新增是否已读字段，默认值为 0（未读）

 在原有的基础上补充数据库
ALTER TABLE BillingApp.dbo.AccountLogin
ADD 
    navbar_background_color NVARCHAR(7) DEFAULT '#2c3e50'  -- 导航栏背景颜色，默认 #32502c 
    navbar_font_color NVARCHAR(7) DEFAULT '#FFFFFF',  -- 导航栏字体颜色，默认白色
    their_font_color NVARCHAR(7) DEFAULT '#000000',  -- 对方字体颜色，默认黑色
    their_bubble_color NVARCHAR(7) DEFAULT '#D3D3D3',  -- 对方对话框颜色，默认灰色
    my_font_color NVARCHAR(7) DEFAULT '#000000',  -- 我的字体颜色，默认黑色
    my_bubble_color NVARCHAR(7) DEFAULT '#90EE90',  -- 我的对话框颜色，默认白色
    background_color NVARCHAR(7) DEFAULT '#F0F0F0',  -- 背景颜色，默认浅灰色
    use_background_image BIT DEFAULT 0;  -- 是否启用背景图片，默认不启用



CREATE TABLE BillingApp.dbo.AccountLogin (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自增长字段，初始值为 1，每次增加 1
    username NVARCHAR(50) NOT NULL,     -- 用户名，限制最大长度为 50 个字符
    password NVARCHAR(255) NOT NULL,    -- 密码，限制最大长度为 255 个字符
    login_time DATETIME NOT NULL DEFAULT GETDATE(),  -- 登录时间，默认为当前时间
    ip_address NVARCHAR(50),            -- 用户登录时的 IP 地址，长度为 50
    status NVARCHAR(20) DEFAULT 'active'  -- 状态，默认为 'active'
     -- 主题设置相关字段
    their_font_color NVARCHAR(7) DEFAULT '#000000',  -- 对方字体颜色，默认黑色
    their_bubble_color NVARCHAR(7) DEFAULT '#D3D3D3',  -- 对方对话框颜色，默认灰色
    my_font_color NVARCHAR(7) DEFAULT '#000000',  -- 我的字体颜色，默认黑色
    my_bubble_color NVARCHAR(7) DEFAULT '#90EE90',  -- 我的对话框颜色，默认白色
    background_color NVARCHAR(7) DEFAULT '#F0F0F0',  -- 背景颜色，默认浅灰色
    use_background_image BIT DEFAULT 0,  -- 是否启用背景图片，默认不启用


     -- 增加导航栏背景和颜色 
    -- 新增的导航栏字体和背景颜色属性
    navbar_font_color NVARCHAR(7) DEFAULT '#FFFFFF',  -- 导航栏字体颜色，默认白色
    navbar_background_color NVARCHAR(7) DEFAULT '#32502c'  -- 导航栏背景颜色，默认 #32502c   
);


消息通知
use BillingApp;
CREATE TABLE MessageDetail (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自动递增的主键
    title NVARCHAR(255) NOT NULL,       -- 消息标题，最大长度 255
    time DATETIME NOT NULL,             -- 消息发布时间
    content NVARCHAR(MAX)               -- 消息内容，支持大量文本和换行
);


绩效表
CREATE TABLE Achievements (
    ID INT IDENTITY(1,1) PRIMARY KEY,          -- 自增长 ID
    ProjectCode VARCHAR(50)  NOT NULL,           -- 项目编号
    ReportNumber VARCHAR(50)  ,          -- 报告号
    ProjectName VARCHAR(255)  NOT NULL,          -- 项目名称
    ChargeAmount DECIMAL(18, 2)  ,       -- 收费金额
    ChargeDate DATE  ,               -- 收费时间
    AchievementAmount DECIMAL(18, 2)  ,  -- 绩效金额
    SignedAmount DECIMAL(18, 2)  ,       -- 签字金额
    CommissionDate DATE ,           -- 提成时间
    PerformancePerson VARCHAR(100) NULL         -- 绩效人 (可为空)
    Notes TEXT NULL                             -- 备注 (可为空)
    Whetherticheng bit NULL     -- 是否提成 
    
);

 报销表
 CREATE TABLE TravelExpenseReimbursement (
    ID INT IDENTITY(1,1) PRIMARY KEY,  -- 自增长的唯一标识
    ProjectCode NVARCHAR(50) NOT NULL,  -- 项目编号，长度为50
    ProjectName NVARCHAR(100) NOT NULL,  -- 项目名称，长度为100
    Location NVARCHAR(100),  -- 地点，长度为100
    Amount DECIMAL(18, 2),  -- 金额，保留两位小数
    BusinessTripDate DATE,  -- 出差时间，日期类型
    ReimbursementDate DATE,  -- 报销时间，日期类型
    Remarks NVARCHAR(255),  -- 备注，长度为255
    ReimbursedBy NVARCHAR(100) NOT NULL  -- 报销人，长度为100
    Whetherover BIT  -- 是否已完成，波尔类型（使用 BIT 存储，值为 0 或 1）
);


创建一个特别提示事项表
CREATE TABLE Special_Tips (
    id INT IDENTITY(1,1) PRIMARY KEY,         -- 自动递增的唯一标识符
    asset_type NVARCHAR(100) NOT NULL,         -- 资产类型(房地产、资产、土地、其他），最大长度 100 字符
    tip_content NVARCHAR(255) NOT NULL,       -- 提示内容，最大长度 255 字符
    remark NVARCHAR(500) NULL                 -- 备注，最大长度 500 字符，允许为空
);

创建报告模板下载
CREATE TABLE BillingApp.dbo.Report_Template (
    id INT IDENTITY(1,1) PRIMARY KEY,         -- 自动递增的唯一标识符
    asset_type NVARCHAR(100) NOT NULL,         -- 资产类型，最大长度 100 字符
    valuation_purpose NVARCHAR(255) NOT NULL,  -- 估价目的，最大长度 255 字符
    valuation_range NVARCHAR(255) NOT NULL,    -- 估价范围，最大长度 255 字符
    valuation_method NVARCHAR(255) NOT NULL,   -- 估价方法，最大长度 255 字符
    remark NVARCHAR(500) NULL                 -- 备注，最大长度 500 字符，允许为空
);

CREATE TABLE BillingApp.dbo.ReportTemplate_Link (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自动递增的唯一标识符
    file_name NVARCHAR(255) NOT NULL,   -- 文件名
    share_view_link NVARCHAR(500),      -- 共享查看链接
    share_download_link NVARCHAR(500),  -- 共享下载链接
    internal_edit_link NVARCHAR(500)    -- 内部编辑链接
);


CREATE TABLE BillingApp.dbo.UsedWebsites (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自动递增的唯一标识符
    type NVARCHAR(100),                 -- 网站类型 (如：房地产、资产、苗木、土地、娱乐)，长度可以根据实际需求调整
    name NVARCHAR(255),                 -- 网站名，长度可根据需要调整
    url NVARCHAR(500)                   -- 网站链接，长度可以根据需要调整
);

//项目派单表
CREATE TABLE BillingApp.dbo.ProjectDispatchForm (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- Auto-increment unique identifier (Primary Key)
    Projectnumber NVARCHAR(255),  -- 项目编号 (Projectnumber)
    ProjectName NVARCHAR(255),  -- 项目名称 (Project Name)
    Branch NVARCHAR(255),  -- 支行/分院 (Branch/Division)
    OrderNumber NVARCHAR(50),  -- 委托号 (Order Number)
    ProjectSource NVARCHAR(255),  -- 项目来源 (Project Source)
    ProjectSourceContact NVARCHAR(100),  -- 项目来源联系人 (Project Source Contact Person)
    ProjectSourcePhone NVARCHAR(50),  -- 项目来源联系方式 (Project Source Contact Phone)
    Client NVARCHAR(255),  -- 委托方 (Client)
    ClientContact NVARCHAR(100),  -- 委托方联系人 (Client Contact Person)
    ClientPhone NVARCHAR(50),  -- 委托方联系方式 (Client Contact Phone)
    Applicant NVARCHAR(255),  -- 申请方 (Applicant)
    ApplicantContact NVARCHAR(100),  -- 申请方联系人 (Applicant Contact Person)
    ApplicantPhone NVARCHAR(50),  -- 申请方联系方式 (Applicant Contact Phone)
    Defendant NVARCHAR(255),  -- 被执行人 (Defendant)
    DefendantContact NVARCHAR(100),  -- 被执行人联系人 (Defendant Contact Person)
    DefendantPhone NVARCHAR(50),  -- 被执行人联系方式 (Defendant Contact Phone)
    ProjectType NVARCHAR(100),  -- 项目类型 (Project Type)
    EvaluationPurpose NVARCHAR(255),  -- 评估目的 (Evaluation Purpose)
    PersonInCharge NVARCHAR(100),  -- 负责人 (Person in Charge)
    EntrustDate DATE,  -- 委托日期 (Entrustment Date)
    DispatchDate DATE,  -- 派单日期 (Dispatch Date)
    Completeprogress BIT,  -- 完成进度 (Completeprogress)
    Principal NVARCHAR(100),  -- 委托方 (Principal)
);
//报告编号管理表
CREATE TABLE BillingApp.dbo.ReportNumberTable (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- Auto-increment unique identifier (Primary Key)
    asset_region NVARCHAR(255),         -- 资产区域 (Asset Region)
    report_type NVARCHAR(255),          -- 报告类型 (Report Type)
    total_assessment_value DECIMAL(18,2), -- 评估总价 (Total Assessment Value)
    asset_usage NVARCHAR(255),          -- 资产用途 (Asset Usage)
    unit_assessment_price DECIMAL(18,2), -- 评估单价 (Unit Assessment Price)
    assessment_area DECIMAL(18,2),      -- 评估面积 (Assessment Area)
    report_count INT,                   -- 报告份数 (Report Count)
    issue_date DATE,                    -- 出具日期 (Issue Date)
    report_number NVARCHAR(255),        -- 报告编号 (Report Number)
    remarks NVARCHAR(500)               -- 备注 (Remarks)
);

//项目收费情况
CREATE TABLE BillingApp.dbo.AssessprojectfeesTable (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自动递增的唯一标识符（主键）
    project_id NVARCHAR(50) NOT NULL,  -- 项目编号，最大长度 50，不能为空
    fee_amount DECIMAL(18, 2) NOT NULL,  -- 收费金额，最多 18 位数字，2 位小数，不能为空
    fee_date DATETIME NOT NULL,  -- 收费时间，日期时间格式，不能为空
    fee_type NVARCHAR(20) NOT NULL,  -- 收费类型，取值可以是“预付款”或“尾款”，不能为空
    remarks NVARCHAR(255) NULL  -- 备注，最大长度 255，可以为空
);

//评估工作日志

CREATE TABLE BillingApp.dbo.EvaluateworklogTable (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- 自动递增的唯一标识符（主键）
    project_id NVARCHAR(50) NOT NULL,  -- 项目编号，最大长度 50，不能为空
    communication_record NVARCHAR(MAX),  -- 沟通记录
    contact_time DATE,  -- 联系时间
);


//机器设备价格查询
CREATE TABLE BillingApp.dbo.MachineryEquipmentPricesTable (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- 自动递增的唯一标识符（主键）
    name NVARCHAR(100) NOT NULL,         -- 设备名称，字符串类型，最大长度为100
    model NVARCHAR(100) NOT NULL,        -- 规格型号，字符串类型，最大长度为100
    manufacturer NVARCHAR(100) NOT NULL, -- 品牌，字符串类型，最大长度为100
    unit NVARCHAR(50) NOT NULL,          -- 单位，字符串类型，最大长度为50
    price DECIMAL(18, 2) NOT NULL        -- 价格，数值类型，保留两位小数
);

//运动记录表
CREATE TABLE SportsApp.dbo.SportsRecordingTable (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- 自动递增的唯一标识符（主键）
    sport_type VARCHAR(50), --运动类型（跑步、深蹲、跳绳、引体向上 、平板撑、羽毛球、俯卧撑、瑜伽）
    unit VARCHAR(20), --计量单位（个，组，米）
    quantity INT, --数量
    date DATE, --日期比如（2025-05-06）
    duration VARCHAR(8), --（时间运动消耗时间，格式为：时：分：秒）
    participant VARCHAR(100), --（运动人员，李中敬、陈彦羽）
    remark NVARCHAR(500) , 
);
CREATE TABLE SportsApp.dbo.SportsOptions (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- 自动递增的唯一标识符（主键）
    sport_type_Options VARCHAR(50) PRIMARY KEY,  -- 运动类型（跑步、深蹲、跳绳、引体向上 、平板撑、羽毛球、俯卧撑、瑜伽）
    unit_Options VARCHAR(20),  -- 计量单位（个，组，米）
	participant_Options VARCHAR(20),  -- 
    icon_Options VARCHAR(255)  -- 图标（存储图标的路径或URL）
);
CREATE TABLE SportsApp.dbo.SportsOptions (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- 自动递增的唯一标识符（主键）
    sport_type_Options VARCHAR(50) NOT NULL UNIQUE,  -- 运动类型（跑步、深蹲、跳绳、引体向上、平板撑、羽毛球、俯卧撑、瑜伽）
    sport_type_English VARCHAR(50),  -- 运动类型英文名称（例如：running, squat, jump_rope, pull_up, plank, badminton, pushup, yoga）
    unit_Options VARCHAR(20),  -- 计量单位（个，组，米）
    participant_Options VARCHAR(20),  -- 参与方式（单人/双人/团体）
    icon_Options VARCHAR(255) DEFAULT 'icon-liuyanmoban'  -- 图标（存储图标的路径或URL）
);

sport_type：运动类型字段，存储例如 "跑步"、"深蹲" 等运动名称。
unit：计量单位字段，存储单位，如 "个"、"组" 或 "米"。
quantity：数量字段，存储运动的数量，比如跑步的距离，深蹲的次数等。
date：日期字段，存储运动记录的日期。
duration：时间字段，存储运动时长，格式为时：分：秒。
participant：运动人员字段，存储参与运动的人员名字。


https://www.cqrdpg.com:5202/api/getUsedWebsitesData

CREATE TABLE ChatApp.dbo.ChatMessages (
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
ALTER TABLE ChatApp.dbo.ChatMessages 
ADD roomId INT NULL;




ALTER TABLE ChatApp.dbo.ChatMessages
ADD message_type VARCHAR(50) DEFAULT 'text',  -- 消息类型，默认是文字类型
    image_filename VARCHAR(255) NULL;          -- 图片文件名，允许为空，存储图片文件名

--聊天房间号
CREATE TABLE ChatApp.dbo.ChatRoomNumber (
    roomId BIGINT IDENTITY(1,1) PRIMARY KEY,          -- 唯一标识符，自增，主键
    sender_name VARCHAR(100) NOT NULL,                      -- 发送者的用户名
    receiver_name VARCHAR(100) NOT NULL,                    -- 接收者的用户名
);

-- 创建房间号表 没用
CREATE TABLE ChatApp.dbo.ChatRoomNumber (
    room_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sender_name VARCHAR(100) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(), -- 建议添加创建时间
    CONSTRAINT UQ_ChatRoom UNIQUE (sender_name, receiver_name) -- 确保同一对用户只有一个房间
);

-- 创建索引以提高查询性能
CREATE INDEX IX_ChatRoomNumber_Users ON ChatApp.dbo.ChatRoomNumber(sender_name, receiver_name);



CREATE TABLE ChatApp.dbo.UserManagement (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 用户ID，自动递增
    username NVARCHAR(50) NOT NULL,     -- 用户账号
    gender VARCHAR(10);  -- 新增性别字段，使用VARCHAR类型，最大长度为10
    password NVARCHAR(100) NOT NULL,    -- 用户密码
    friend NVARCHAR(50),                -- 好友账号，可以为空
    friend_ip VARCHAR(15)              -- 好友IP地址，使用VARCHAR类型，最大长度为15
    is_friend_request_accepted BIT      -- 是否同意好友请求，1为同意，0为不同意
    is_show_request BIT DEFAULT 1;  -- 默认值设为 1，表示默认显示请求
    friend_nickname NVARCHAR(50)       -- 好友备注昵称字段，长度可根据需要调整
);
username   friend
李中敬         蜗牛妹妹
蜗牛妹妹       李中敬
这两条数据对应的is_friend_request_accepted都修改为1
ALTER TABLE ChatApp.dbo.UserManagement
ADD friend_nickname NVARCHAR(50);  -- 新增好友备注昵称字段


CREATE TABLE ChatApp.dbo.Music (
    id INT IDENTITY(1,1) PRIMARY KEY,       -- 自增 ID 作为主键
    title NVARCHAR(255) NOT NULL,            -- 音乐标题，最大字符数 255
    artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    coverimage NVARCHAR(255),                -- 封面图像路径，最大字符数 255
    src NVARCHAR(255) NOT NULL              -- 音乐文件源路径，最大字符数 255
    genre NVARCHAR(50)                      -- 歌曲类型（欧美、华语、韩语、其他等），最大字符数 50
    playcount INT DEFAULT 0,                 -- 播放量，默认为 0
    updatetime DATETIME DEFAULT GETDATE()    -- 更新时的当前时间，默认为当前时间
);
ALTER TABLE ChatApp.dbo.Music
ADD playcount INT DEFAULT 0,                 -- 播放量，默认为 0
    updatetime DATETIME DEFAULT GETDATE()    -- 更新时的当前时间，默认为当前时间

对每首音乐的评论
CREATE TABLE ChatApp.dbo.MusicComments (
    comment_id INT IDENTITY(1,1) PRIMARY KEY,  -- 自增 ID 作为主键
    music_id INT NOT NULL,                      -- 音乐 ID，外键引用 Music 表的 id
    user_name NVARCHAR(255) NOT NULL,           -- 评论的用户名称
    music_title NVARCHAR(255) NOT NULL,            -- 音乐标题，最大字符数 255
    music_artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    comment_text NVARCHAR(1000) NOT NULL,       -- 评论内容，最大字符数 1000
    created_at DATETIME DEFAULT GETDATE(),     -- 评论时间，默认当前时间
    FOREIGN KEY (music_id) REFERENCES ChatApp.dbo.Music(id) 
    ON DELETE CASCADE                           -- 当 Music 表中的歌曲删除时，删除该歌曲的评论
);

CREATE TABLE ChatApp.dbo.MusicFavorites (
    id INT IDENTITY(1,1) PRIMARY KEY,        -- Unique Identifier
    user_name NVARCHAR(100) NOT NULL,              -- User who likes the song
    song_name NVARCHAR(255) NOT NULL,         -- Name of the song
    artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    play_count INT NOT NULL                   -- Number of times the song has been played
);

//经常播放的音乐
CREATE TABLE ChatApp.dbo.RecentlyPlayedMusic (
    id INT IDENTITY(1,1) PRIMARY KEY,        --  
    username NVARCHAR(100) NOT NULL,         -- 用户名
    title NVARCHAR(255) NOT NULL,            -- 音乐标题，最大字符数 255
    artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    coverimage NVARCHAR(255),                -- 封面图像路径，最大字符数 255
    src NVARCHAR(255) NOT NULL,              -- 音乐文件源路径，最大字符数 255
    genre NVARCHAR(50),                      -- 歌曲类型（欧美、华语、韩语、其他等），最大字符数 50
    playtime DATETIME DEFAULT GETDATE()      -- 默认当前时间
);

//用户播放记录 用来记录上一次播放到哪一首
CREATE TABLE ChatApp.dbo.PlayMusicHistory (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- 自增 ID 作为主键
    user_name NVARCHAR(100) NOT NULL,              -- 用来记录谁播放了歌曲
    music_id INT NOT NULL,                     -- 音乐 ID，外键引用 Music 表的 id
    music_title NVARCHAR(255) NOT NULL,            -- 音乐标题，最大字符数 255
    music_artist NVARCHAR(255) NOT NULL,           -- 艺术家/歌手，最大字符数 255
    last_played_at DATETIME DEFAULT GETDATE(), -- 上次播放时间，默认当前时间
    FOREIGN KEY (music_id) REFERENCES ChatApp.dbo.Music(id)
    ON DELETE CASCADE      -- 外键，关联到 Music 表
);


CREATE TABLE ChatApp.dbo.WeatherData (
    id INT IDENTITY(1,1) PRIMARY KEY,        -- 唯一标识
    date DATE NOT NULL,                       -- 日期
    mintemperature INT NOT NULL,                 -- 最小温度
    maxtemperature INT NOT NULL,                 -- 最高温度
    weather NVARCHAR(50) NOT NULL,            -- 天气（晴、雨等）
    suggestion NVARCHAR(255) NOT NULL,        -- 穿衣建议
);
CREATE TABLE ChatApp.dbo.DressingGuidelinesData (
    id INT IDENTITY(1,1) PRIMARY KEY,        -- 唯一标识
    date DATE NOT NULL,                       -- 日期
    imagesrc NVARCHAR(255) NOT NULL,          -- 图片文件名
    imagetype NVARCHAR(255) NOT NULL,          -- 图片类型(比如说外套、内衣、鞋子）)
    description NVARCHAR(255) NOT NULL        -- 图片描述
);

CREATE TABLE ChatApp.dbo.DressingComment (
    id INT IDENTITY(1,1) PRIMARY KEY,              -- 唯一标识
    weatherdata_id INT NOT NULL,             -- 外键，指向 WeatherData 表
    comment NVARCHAR(500) NOT NULL,                 -- 评论内容
    created_at DATETIME DEFAULT GETDATE(),         -- 评论创建时间
    user_name NVARCHAR(100) NOT NULL,               -- 评论者姓名
    FOREIGN KEY (weatherdata_id) REFERENCES ChatApp.dbo.WeatherData(id)
    ON DELETE CASCADE                               -- 如果 WeatherData 的记录被删除，评论也会被删除
);

创建与 DressingGuidelinesData 表的关联。这个关联通过外键来实现，当 DressingGuidelinesData 中的某个 id 被删除时，评论表中的相关数据会自动删除


一起来听音乐
-- 音乐房间表
CREATE TABLE ChatApp.dbo.MusicRooms (
    room_id INT IDENTITY(1,1) PRIMARY KEY,          -- 房间ID，主键，自增长
    room_name NVARCHAR(100) NOT NULL UNIQUE,         -- 房间名称，必须唯一
    password NVARCHAR(100),                          -- 房间密码，若有则设置密码
    host NVARCHAR(100) NOT NULL,                     -- 房间主持人（创建者）名称
    room_status NVARCHAR(50) NOT NULL DEFAULT '等待中', -- 房间状态，默认值为 '等待中'，表示房间当前状态（例如：等待中、进行中等）
    max_users INT NOT NULL DEFAULT 10,               -- 房间的最大用户数，默认为10
    song_name NVARCHAR(255),                         -- 当前播放的歌曲名称
    artist NVARCHAR(255),                            -- 当前播放的艺术家/歌手名称
    [current_time] FLOAT DEFAULT 0,                  -- 当前播放的时间点，单位为秒，默认值为0
    is_playing BIT DEFAULT 0,                        -- 当前是否正在播放，0 表示不在播放，1 表示正在播放
    created_at DATETIME NOT NULL DEFAULT GETDATE()   -- 房间创建时间，默认当前时间
    play_mode NVARCHAR(50) DEFAULT 'order'        -- 播放模式，默认值为 '顺序播放'
);

ALTER TABLE ChatApp.dbo.Music
ADD playcount INT DEFAULT 0,                 -- 播放量，默认为 0
    updatetime DATETIME DEFAULT GETDATE()    -- 更新时的当前时间，默认为当前时间



-- 房间用户表
CREATE TABLE ChatApp.dbo.MusicRoomUsers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    room_name NVARCHAR(100) NOT NULL,
    user_name NVARCHAR(100) NOT NULL,
    is_host BIT NOT NULL DEFAULT 0,
    join_time DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_MusicRoomUsers_RoomUser UNIQUE (room_name, user_name),
    FOREIGN KEY (room_name) REFERENCES ChatApp.dbo.MusicRooms(room_name) ON DELETE CASCADE
);

-- 房间消息表
CREATE TABLE ChatApp.dbo.MusicRoomMessages (
    id INT IDENTITY(1,1) PRIMARY KEY,               -- 消息ID，主键，自增长
    room_name NVARCHAR(100) NOT NULL,                -- 房间名称，外键，关联 MusicRooms 表的 room_name 字段
    user_name NVARCHAR(100) NOT NULL,                -- 发送消息的用户名称
    message NVARCHAR(1000) NOT NULL,                 -- 消息内容，最大长度为 1000 字符
    sent_at DATETIME NOT NULL DEFAULT GETDATE(),     -- 消息发送时间，默认当前时间
    FOREIGN KEY (room_name) REFERENCES ChatApp.dbo.MusicRooms(room_name) 
        ON DELETE CASCADE                            -- 外键约束，删除 MusicRooms 中的房间时，自动删除该房间的所有消息
);



假设你在 MusicRooms 表中有一个房间（room_id = 1），并且 RoomUsers 表中有一个记录是 room_id = 1 的用户。如果这个房间（room_id = 1）被删除了，RoomUsers 表中所有与该房间相关的用户记录（room_id = 1）也会被自动删除


解决全文搜索卡顿的现象
为了提高关键词搜索的性能，可以考虑在数据库中添加全文索引：

CREATE TABLE ChatApp.dbo.ListenMusicTogetherTimeCount (
    id INT IDENTITY(1,1) PRIMARY KEY, -- 自增长的ID字段
    room_name NVARCHAR(255) NOT NULL, -- 房间名称
    room_owner NVARCHAR(255) NOT NULL, -- 房间房主
    room_user NVARCHAR(255) NOT NULL, -- 房间用户
    listen_time INT NOT NULL -- 一起听歌时长（单位：分钟）
);
为了优化性能，可以在数据库表上添加索引：

-- 添加索引以提高查询性能
CREATE INDEX idx_listen_music_time ON ChatApp.dbo.ListenMusicTogetherTimeCount (room_name, room_user);


sql
复制
-- 在WeatherData表的suggestion字段上创建全文索引
CREATE FULLTEXT INDEX ft_weather_suggestion ON ChatApp.dbo.WeatherData(suggestion);

-- 在DressingGuidelinesData表的description和imagetype字段上创建全文索引
CREATE FULLTEXT INDEX ft_dressing_desc ON ChatApp.dbo.DressingGuidelinesData(description);
CREATE FULLTEXT INDEX ft_dressing_type ON ChatApp.dbo.DressingGuidelinesData(imagetype);
然后可以修改SQL查询使用全文搜索语法：

sql
复制
WHERE CONTAINS(w.suggestion, @keyword)
   OR CONTAINS(d.description, @keyword)
   OR CONTAINS(d.imagetype, @keyword)
这样会显著提高关键词搜索的性能，特别是当数据量较大时。

数据库存储的是 2025-04-14 13:28:59.463（UTC+8 北京时间），但前端显示为 2025-04-14 21:28:59（UTC+0）

CREATE TABLE ChatApp.dbo.BugTrackingData (
    id INT IDENTITY(1,1) PRIMARY KEY,            -- 唯一标识
    bug_description NVARCHAR(255) NOT NULL,      -- bug 描述
    reported_by NVARCHAR(100) NOT NULL,          -- 提交 bug 的人
    report_date DATETIME NOT NULL,               -- 提交时间
    severity NVARCHAR(50),                       -- bug 严重程度 (例如: Low, Medium, High)
    status NVARCHAR(50) DEFAULT 'Open',          -- bug 状态 (Open, In Progress, Resolved, Closed 等)
    resolved_by NVARCHAR(100),                   -- 解决 bug 的人
    resolution_date DATETIME,                    -- bug 解决时间
    fix_version NVARCHAR(50),                    -- 修复的版本（如果适用）
    comments NVARCHAR(MAX)                       -- 相关备注或解决方案描述
);

新的创建一个记账本 
CREATE TABLE ChatApp.dbo.LifeBookkeepingData (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,     -- 交易ID，唯一标识
    transaction_date DATE NOT NULL,                -- 交易时间
    amount DECIMAL(18, 2) NOT NULL,                    -- 交易金额，使用DECIMAL类型来确保精度
    transaction_type NVARCHAR(50) NOT NULL,            -- 交易类型 (收入 / 支出)
    category NVARCHAR(100),                            -- 交易类别 (例如: 食品, 交通, 工资等)
    payment_method NVARCHAR(50),                       -- 支付方式 (现金、银行卡、支付宝、微信等)
    description NVARCHAR(255),                         -- 交易描述 (详细说明)
    created_by NVARCHAR(100) NOT NULL,                 -- 记录创建人

    note NVARCHAR(MAX)                                 -- 额外备注或说明
    created_date DATETIME DEFAULT GETDATE(),          -- 记录创建时间 (默认当前时间)
    updated_by NVARCHAR(100),                          -- 最近更新记录的人
    updated_date DATETIME,                             -- 最近更新时间

);
CREATE TABLE ChatApp.dbo.ChatAppIconFot (
     id INT IDENTITY(1,1) PRIMARY KEY,     -- 图标ID，唯一标识
     icon_name VARCHAR(100) NOT NULL,       -- 图标名称
     unicode VARCHAR(MAX) NOT NULL          -- 图标的Unicode表示（现在可以存储更长的文本）
     icon_type VARCHAR(50) NOT NULL DEFAULT '支出' -- 图标类型，默认为'支出'
);

 BillingApp.dbo.Records
id   int
category nvarchar(100)  消费类型
subcategory   nvarchar(100) 备注
amount  decimal(10, 2) 金额
date  date 日期
person  nvarchar(50) 人员


BillingApp.dbo.Records          ChatApp.dbo.LifeBookkeepingData
 id   int （复制以这个id为准）     transaction_id INT IDENTITY(1,1) PRIMARY KEY,
 category nvarchar(100)（复制以这个为准）         category NVARCHAR(100),             
 subcategory  nvarchar(100)（复制以这个为准）     description NVARCHAR(255)
 date  date（复制以这个为准）          created_date DATETIME DEFAULT GETDATE(),      
 person  nvarchar(50)（复制以这个为准）              created_by NVARCHAR(100) NOT NULL,                

 复制数据表 
 INSERT INTO ChatApp.dbo.LifeBookkeepingData (
    transaction_date,
    amount,
    transaction_type,
    category,
    payment_method,
    description,
    created_by,
    note,
    created_date,
    updated_by,
    updated_date
)
SELECT 
    r.date,
    r.amount,
    -- 假设所有从BillingApp复制的数据都是支出类型，可根据实际情况调整
    N'支出' AS transaction_type,
    r.category,
    -- 若原表没有支付方式信息，这里可以设为NULL或默认值，可根据实际情况调整
    NULL AS payment_method,
    r.subcategory,
    r.person,
    -- 若原表没有额外备注信息，这里可以设为NULL，可根据实际情况调整
    NULL AS note,
    r.date,
    -- 若原表没有更新人信息，这里可以设为NULL，可根据实际情况调整
    NULL AS updated_by,
    -- 若原表没有更新时间信息，这里可以设为NULL，可根据实际情况调整
    NULL AS updated_date
FROM 
    BillingApp.dbo.Records r;




    创建智能衣柜数据库：
    CREATE TABLE ChatApp.dbo.WardrobeStewardData (
    ItemID INT PRIMARY KEY IDENTITY(1,1),
    MainCategory NVARCHAR(20) NOT NULL CHECK (MainCategory IN ('上衣', '下装', '连衣裙', '鞋子')),
    SubCategory NVARCHAR(20) NOT NULL,
    ItemType NVARCHAR(50) NOT NULL,
    SeasonTag NVARCHAR(10) CHECK (SeasonTag IN ('夏季', '冬季', '四季')),
    ItemCode VARCHAR(50) UNIQUE,
    Description NVARCHAR(255),
    CreatedDate DATETIME DEFAULT GETDATE()
);
CREATE TABLE ChatApp.dbo.WardrobeStewardData (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- 唯一ID
    season NVARCHAR(20) NOT NULL,        -- 季节性标签 (夏季、冬季、四季)
    category NVARCHAR(50) NOT NULL,      -- 类别 (如衣服、裤子、连衣裙、鞋子、配饰)
    sub_category NVARCHAR(50) NOT NULL,  -- 子类别 (如基础款、外套类、裤装、裙装等)
    item_name NVARCHAR(100) NOT NULL,    -- 服装名称 (如背心、短裤等,可以自己输入，可以选择输入)
    length INT NOT NULL,                 -- 衣服的长度（整数型）
    width INT NOT NULL,                  -- 衣服的宽度（整数型）
    item_code NVARCHAR(20) UNIQUE,       -- 服装编码，保证唯一性
    length INT NOT NULL,                 -- 衣服的长度（整数型）
    width INT NOT NULL,                  -- 衣服的宽度（整数型）
    created_at DATETIME DEFAULT GETDATE(), -- 创建时间
    updated_at DATETIME DEFAULT GETDATE() -- 更新时间
);



-- 创建索引优化查询性能
CREATE INDEX IX_Wardrobe_MainCategory ON WardrobeStewardData(MainCategory);
CREATE INDEX IX_Wardrobe_SubCategory ON WardrobeStewardData(SubCategory);
CREATE INDEX IX_Wardrobe_Season ON WardrobeStewardData(SeasonTag);
衣服：
        基础款：
                背心
                吊带
                短袖
                长袖
                衬衫
                其他
        外套类：
                夹克
                开衫
                风衣
                其他
裤子：
        裤装：
                短裤
                长裤
                七分裤
                阔腿裤
               牛仔裤
                其他
        裙装：
                短裙
                中长裙
                长裙
                其他

连衣裙：
        基础款：
                衬衫裙
                其他
鞋子：
        基础款：
                运动鞋
                帆布鞋
                皮鞋
                凉鞋
                靴子
                拖鞋
                其他
 配饰               
        基础款：
                 包       



增加季节性标签：夏季、冬季、四季
增加衣服编码


经期
-- 创建月经周期记录表
CREATE TABLE ChatApp.dbo.PeriodRecords (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL,  -- 用户
    RecordDate DATE NOT NULL,      -- 记录日期
    IsPeriod BIT NOT NULL,         -- 是否为经期

);
向 PeriodRecords 表中添加新的字段
ALTER TABLE ChatApp.dbo.PeriodRecords
ADD 
    Remarks NVARCHAR(255) NULL,  -- 备注
    DysmenorrheaLevel INT NULL,  -- 痛经程度
    Symptoms NVARCHAR(255) NULL; -- 症状


-- 创建索引以提高查询性能
CREATE INDEX IX_PeriodRecords_UserId ON ChatApp.dbo.PeriodRecords(UserId);
CREATE INDEX IX_PeriodRecords_RecordDate ON ChatApp.dbo.PeriodRecords(RecordDate);


创建新的报告下载表
CREATE TABLE ChatApp.dbo.TemplateManagement (
    Id INT PRIMARY KEY IDENTITY(1,1),  -- 主键，自增标识
    AssetType NVARCHAR(50) NOT NULL,  -- 资产类型（非空）
    AssetTypeRemark NVARCHAR(255) NULL,  -- 资产类型备注（可为空
    ValuationPurpose NVARCHAR(50) NOT NULL,  -- 估价目的（非空）
    DocumentName NVARCHAR(100) NOT NULL,  -- 文档名称（非空）
    DocumentRemark NVARCHAR(255) NULL  -- 文档备注（可为空）
);

CREATE TABLE ChatApp.dbo.EvaluationFilePreview (
    FileID INT IDENTITY(1,1) PRIMARY KEY,      -- 文件ID，主键
    CategoryName NVARCHAR(100) NOT NULL,        -- 分类名称
    FileName NVARCHAR(255) NOT NULL,            -- 文件名
    Remarks NVARCHAR(255),                      -- 备注
);


网页生成报告

评估报告信息
CREATE TABLE WebWordReports.dbo.WordReportsInformation (
    reportsID INT IDENTITY(1,1) PRIMARY KEY,         -- ID，主键，自动增长
    documentNo VARCHAR(50) NOT NULL,                 -- 委托书编号 可以存储字母、数字或特殊字符，最大长度为 50 个字符
    entrustDate DATE NOT NULL,                       -- 委托日期
    entrustingParty VARCHAR(100) NOT NULL,           -- 委托方
    location VARCHAR(255) NOT NULL,                  -- 房产坐落
    buildingArea DECIMAL(10, 2) NOT NULL,            -- 建筑面积，精度为 10 位数，保留 2 位小数
    interiorArea DECIMAL(10, 2) NOT NULL,            -- 套内面积，精度为 10 位数，保留 2 位小数
    valueDate DATE NOT NULL,                         -- 价值时点
    reportDate DATE NOT NULL,                        -- 报告日期
    appraiserNameA VARCHAR(50) NOT NULL,             -- 估价师 A 姓名
    appraiserRegNoA VARCHAR(50) NOT NULL,            -- 估价师 A 注册号
    appraiserNameB VARCHAR(50) NOT NULL,              -- 估价师 B 姓名
    appraiserRegNoB VARCHAR(50) NOT NULL,             -- 估价师 B 注册号
    communityName VARCHAR(100) NOT NULL,              -- 小区名称
    totalFloors INT NOT NULL,                          -- 总层数
    floorNumber INT NOT NULL,                          -- 所在楼层
    housePurpose VARCHAR(100) NOT NULL,                -- 房屋用途
    propertyUnitNo VARCHAR(50) NOT NULL,               -- 不动产单元号
    rightsHolder VARCHAR(100) NOT NULL,                -- 权利人
    landPurpose VARCHAR(100) NOT NULL,                 -- 土地用途
    sharedLandArea DECIMAL(10, 2) NOT NULL,            -- 共有宗地面积
    landUseRightEndDate DATE NOT NULL,                 -- 土地使用权终止日期
    houseStructure VARCHAR(100) NOT NULL,              -- 房屋结构
    coOwnershipStatus VARCHAR(100) NOT NULL,           -- 共有情况
    rightsNature VARCHAR(50) NOT NULL,                 -- 权利性质（出让、划拨）
    elevator BIT NOT NULL,                             -- 电梯（有、无）
    decorationStatus VARCHAR(500) NOT NULL,            -- 装饰装修
    ventilationStatus BIT NOT NULL,                    -- 通气（是、否）
    spaceLayout VARCHAR(100) NOT NULL,                 -- 空间布局
    exteriorWallMaterial VARCHAR(100) NOT NULL,        -- 外墙面
    yearBuilt INT NOT NULL,                            -- 建成年份
    boundaries VARCHAR(255) NOT NULL,                  -- 四至
    valuationMethod VARCHAR(100) NOT NULL              -- 估价方法
    propertyCertificateNo VARCHAR(50) NOT NULL         -- 产权证号
    projectID VARCHAR(50) NOT NULL,                    -- 项目编号
    reportID VARCHAR(50) NOT NULL,                      -- 报告编号
    valuationPrice DECIMAL(15, 0) NOT NULL,            -- 评估单价 (没有小数)
    assessmentCommissionDocument VARCHAR(255)  NOT NULL  -- 评估委托文书（选项值）
    hasFurnitureElectronics BIT NOT NULL DEFAULT 0,     -- 是否包含家具家电，默认值为 0（即否）
    furnitureElectronicsEstimatedPrice DECIMAL(6, 0) NOT NULL,  -- 家具家电评估总价，整数类型
    valueDateRequirements VARCHAR(500) NOT NULL;          -- 价值时点要求，最大长度500字符
    landShape VARCHAR(500) NULL,               -- 土地形状
    streetStatus VARCHAR(500) NULL,            -- 临街状况
    direction VARCHAR(500) NULL,                -- 方位
    orientation VARCHAR(500) NULL,              -- 朝向
    distance VARCHAR(500) NULL,                 -- 距离
    parkingStatus VARCHAR(500) NULL;           -- 停车状况

    mortgageStatus BIT NULL DEFAULT 1,                       -- 抵押状况 默认是1
    mortgageBasis VARCHAR(500) NULL,                          -- 抵押依据
    seizureStatus BIT NULL DEFAULT 1,                         -- 查封状况 默认是1
    seizureBasis VARCHAR(500) NULL,                           -- 查封依据
    utilizationStatus VARCHAR(500) NULL,                      -- 利用状况
    isLeaseConsidered BIT NULL DEFAULT 0                      -- 是否考虑租约（1 = 是，0 = 否） 默认是0
    rent DECIMAL(18, 2) NOT NULL DEFAULT 0.00;  -- 租金字段，类型为 DECIMAL，默认值为 0.00


); 


-- 创建图片表
CREATE TABLE WebWordReports.dbo.HousePricePicture (
    pictureId INT IDENTITY(1,1) PRIMARY KEY,         -- 图片ID，主键，自增长
    pictureFileName NVARCHAR(100) NOT NULL,          -- 图片文件名
    reportsID INT NOT NULL,                          -- 必须添加这个外键字段！！！
    FOREIGN KEY (reportsID) REFERENCES WebWordReports.dbo.WordReportsInformation(reportsID) 
        ON DELETE CASCADE                            -- 外键约束
);


 ALTER TABLE WebWordReports.dbo.WordReportsInformation
ADD rent DECIMAL(18, 2) NOT NULL DEFAULT 0.00;  -- 租金字段，类型为 DECIMAL，默认值为 0.00


ALTER TABLE WebWordReports.dbo.WordReportsInformation
ADD 
    communityName VARCHAR(100) NOT NULL,              -- 小区名称
    totalFloors INT NOT NULL,                          -- 总层数
    floorNumber INT NOT NULL,                          -- 所在楼层
    housePurpose VARCHAR(100) NOT NULL,                -- 房屋用途
    hasFurnitureElectronics BIT NOT NULL DEFAULT 0,     -- 是否包含家具家电，默认值为 0（即否）
    furnitureElectronicsEstimatedPrice DECIMAL(10, 0) NOT NULL;  -- 家具家电评估总价 (DECIMAL 类型，最多 10 位数字，其中 2 位为小数)
;

ALTER TABLE WebWordReports.dbo.WordReportsInformation
ADD 
    bank VARCHAR(100),                                 -- 附近银行
    supermarket VARCHAR(500),                          -- 附近超市
    hospital VARCHAR(500),                             -- 附近医院
    school VARCHAR(500),                               -- 附近学校
    nearbyCommunity VARCHAR(500),                      -- 附近小区
    busStopName VARCHAR(500),                          -- 附近公交站名
    busRoutes VARCHAR(500),                            -- 附近公交线路
    areaRoad VARCHAR(500);                             -- 附近区域道路



导出Word评估报告对应的字段
  valueDateChinese VARCHAR(100) NOT NULL,          -- 价值时点大写
  reportExpiryDate DATE NOT NULL,                  -- 报告有效终止日期
  totalValuationPrice DECIMAL(15, 2) NOT NULL,     -- 评估总价小写
  totalValuationPriceChinese VARCHAR(200) NOT NULL -- 评估总价大写

下面的不是数据库中的    👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
  reportExpiryDate DATE ,                  -- 报告有效终止日期
  totalValuationPrice DECIMAL(15, 2) ,     -- 评估总价小写
  totalValuationPriceChinese VARCHAR(200)  -- 评估总价大写
  propertyCertificateType VARCHAR(255);  -- 产权证类型（选项值）
  landRemainingUsageYears DECIMAL(4, 2);  -- 土地剩余使用年限，最多4位数，其中2位小数
  reportStartDateLowercase VARCHAR(10) NOT NULL;  -- 报告起始日期的小写形式，存储日期的字符串 2025-5-6
  valueDateUppercase VARCHAR(255) NOT NULL;  -- 价值时点日期的大写形式 
  totalGroundHeight BIGINT NOT NULL;  -- 地面总高字段，较大范围的整数类型
  publicServices VARCHAR(255) NOT NULL               -- 公共服务设施
  
  furnitureElectronicsEstimatedPriceChinese VARCHAR(200) NOT NULL,  -- 家具家电评估总价大写
  totalValuationPriceWithFurniture DECIMAL(15, 2) NOT NULL,         -- 家具家电和房屋总价小写
  totalValuationPriceWithFurnitureChinese VARCHAR(200) NOT NULL;    -- 家具家电和房屋总价大写
  valueDateDetermination VARCHAR(500) NOT NULL;    -- 价值时点确定方式
  combinedEquityStatus  VARCHAR(500) NOT NULL;    -- 综合汇总权益状况
  otherRights  VARCHAR(500) NOT NULL;    -- 他项权利
  Leasehold  VARCHAR(500) NOT NULL;    -- 租赁权

产权信息：
产权证号  房屋用途  不动产单元号 权利人 土地用途 共有宗地面积 土地使用权终止日期 房屋结构 共有情况 权利性质（出让、划拨）

实物状况：
小区名称 总层数 所在楼层 电梯（有、无） 装饰装修 通气（是、否） 空间布局 外墙面 建成年份 四至

结果信息：
估价方法

选项
CREATE TABLE WebWordReports.dbo.WordReportOptions (
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
);


housePurpose VARCHAR(100) NOT NULL,                -- 房屋用途
    houseStructure VARCHAR(100) NOT NULL,              -- 房屋结构
    coOwnershipStatus VARCHAR(100) NOT NULL,           -- 共有情况
    landPurpose VARCHAR(100) NOT NULL,                 -- 土地用途
    rightsNature VARCHAR(50) NOT NULL,                 -- 权利性质（出让、划拨）
    exteriorWallMaterial VARCHAR(100) NOT NULL,        -- 外墙面
    valuationMethod VARCHAR(100) NOT NULL              -- 估价方法
);
ALTER TABLE WebWordReports.dbo.WordReportOptions
ADD 
     housePurposeOptions VARCHAR(255) UNIQUE,            -- 房屋用途（选项值）唯一，可以为空
     houseStructureOptions VARCHAR(255) UNIQUE,            -- 房屋结构（选项值）唯一，可以为空
     coOwnershipStatusOptions VARCHAR(255) UNIQUE,            -- 共有情况（选项值）唯一，可以为空
     landPurposeOptions VARCHAR(255) UNIQUE,            -- 土地用途（选项值）唯一，可以为空
     rightsNatureOptions VARCHAR(255) UNIQUE,            -- 权利性质（选项值）唯一，可以为空
     exteriorWallMaterialOptions VARCHAR(255) UNIQUE,            -- 外墙面（选项值）唯一，可以为空
     valuationMethodOptions VARCHAR(255) UNIQUE,            -- 估价方法（选项值）唯一，可以为空
);


CREATE TABLE WebWordReports.dbo.ApiDatabas (
    id INT IDENTITY(1,1) PRIMARY KEY,      -- 文件ID，主键
    apiUsername  VARCHAR(255) NOT NULL,        -- 用户
    apiName  VARCHAR(255) NOT NULL,        -- API名称
    apiKey  VARCHAR(255) NOT NULL,        -- API密钥   
    remark  VARCHAR(255) NOT NULL,   -- 备注
);


创建苗木数据库 TreeDB

CREATE TABLE ChatApp.dbo.TreeDB (
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

CREATE TABLE BillingApp.dbo.Structures (
    id INT IDENTITY(1,1) PRIMARY KEY,      -- ID，主键
    name nvarchar(100) NOT NULL,             -- 名称
    structure nvarchar(100),                  -- 结构
    area nvarchar(100),                    -- 区域
    unit nvarchar(50),               -- 单位
    price nvarchar(50),                    -- 价格
    notes TEXT                              -- 备注
);

创建系统主题设置数据库
CREATE TABLE WebWordReports.dbo.SystemThemeDB (
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
8位带透明度的格式（如 #376fbcFF）
十六进制	透明度百分比	十进制值
00	0% (完全透明)	0
33	20%	51
66	40%	102
99	60%	153
CC	80%	204
FF	100% (完全不透明)	255


构筑物表

-- 创建 BuildingsPricePicture 表
CREATE TABLE Buildings.dbo.BuildingsPricePicture (
    pictureId INT IDENTITY(1,1) PRIMARY KEY,       -- 图片ID，主键，自增长
    pictureFileName NVARCHAR(100) NOT NULL,         -- 图片文件名
    buildingsPriceid INT NOT NULL,                  -- 外键字段，关联 BuildingsPrice 表
    FOREIGN KEY (buildingsPriceid) REFERENCES Buildings.dbo.BuildingsPrice(buildingsPriceid) 
        ON DELETE CASCADE                          -- 外键约束，级联删除
);

 
-- 创建 BuildingsPrice 表
CREATE TABLE Buildings.dbo.BuildingsPrice (
    buildingsPriceid INT IDENTITY(1,1) PRIMARY KEY,  -- ID，主键
    name NVARCHAR(100) NOT NULL,                     -- 名称
    structure NVARCHAR(100),                         -- 结构
    area NVARCHAR(100),                              -- 区域
    unit NVARCHAR(50),                               -- 单位
    price NVARCHAR(50),                              -- 价格
createdDate DATE NOT NULL DEFAULT GETDATE(),      -- 日期字段，默认当前日期
    notes NVARCHAR(MAX)                              -- 备注
);

-- 创建 ReportPdfPrintFile 评估报告附件装订pdf文件 表
CREATE TABLE PdfFileData.dbo.ReportPdfPrintFile (
    pdfPrintFileId INT IDENTITY(1,1) PRIMARY KEY,  -- ID，主键
     companyName NVARCHAR(100) NOT NULL DEFAULT 'ruida',  -- 新增：公司名称，非空且默认值为'ruida'
    fileType NVARCHAR(50) NOT NULL DEFAULT '房地产',        -- 文件类型，默认值为 '房地产'
    pdfPrintFileName NVARCHAR(100) NOT NULL,         -- PDF文件名
    paperSize NVARCHAR(10) NOT NULL DEFAULT 'A4',           -- 纸张大小，默认值为 A4
    effectiveDate DATE NOT NULL DEFAULT GETDATE(),          -- 有效期字段（日期类型），默认值为当前日期
    notes NVARCHAR(MAX) NULL                                 -- 备注，允许为空
);

CREATE TABLE PdfFileData.dbo.PdfPrintFileCompanyPersonnel (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- ID，主键
     companyName NVARCHAR(100) NOT NULL DEFAULT 'ruida',  -- 新增：公司名称，非空且默认值为'ruida'
   username NVARCHAR(50) NOT NULL,     -- 用户名，限制最大长度为 50 个字符
   email NVARCHAR(100) NOT NULL,       -- 用户邮箱
            
);


CREATE TABLE RealEstateAISearch.dbo.QuestionType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    comparison NVARCHAR(MAX) NOT NULL,       
    triggerKeyword NVARCHAR(MAX) NOT NULL,   
);
INSERT INTO RealEstateAISearch.dbo.QuestionType (comparison, triggerKeyword)
VALUES 
('comparison', '对比、比较、哪个贵、相差、比……便宜、均价'),
('statistics', '房源、明细、数据、统计、分布、多少'),
('trend', '趋势、变化、最近'),
('valuation', '多少钱、价值多少、价值多少钱、多少元、多少一平');

CREATE TABLE RealEstateAISearch.dbo.SearchKeywords (
    id INT IDENTITY(1,1) PRIMARY KEY,
    searchType NVARCHAR(MAX) NOT NULL,      
    triggerKeyword NVARCHAR(MAX) NOT NULL,   
    SearchKeyword NVARCHAR(MAX)
);
INSERT INTO RealEstateAISearch.dbo.SearchKeywords (searchType, triggerKeyword, SearchKeyword)
VALUES 
-- location区域
('location', '坐落、位于、涉及、区、县', '渝北、九龙坡、南岸、巴南、江北、沙坪坝、渝中、北碚、大渡口、江津、合川、永川、长寿、涪陵、綦江、大足、璧山、铜梁、潼南、荣昌、梁平、城口、丰都、垫江、武隆、忠县、开州、云阳、奉节、巫山、巫溪、石柱、秀山、酉阳、彭水'),

-- buildingArea建筑面积
('buildingArea', '建筑面积、名义面积、上证面积、面积', '40、50、60、70、80、90、100、120、150、200'),

-- interiorArea套内面积
('interiorArea', '套内面积、使用面积、实得面积', '40、50、60、70、80、90、100、120、150、200'),

-- communityName小区名称
('communityName', '小区名称、小区名、小区、楼盘', NULL),

-- totalFloors总楼层
('totalFloors', '总楼层、所有楼层、一共楼层、总层数', '1、2、3、6、8、11、18、26、32、33'),

-- floorNumber所在楼层
('floorNumber', '所在楼层、所在层、名义层、第几层', '1、2、3、4、5、6、7、8、9、10、11、12、13、14、15、16、17、18、19、20、21、22、23、24、25、26、27、28、29、30、31、32、33'),

-- housePurpose房屋用途
('housePurpose', '住宅、办公、商、厂房、商业、商铺', '住宅、办公、商业、厂房'),

-- elevator电梯
('elevator', '电梯、有电梯、无电梯', 'True、False'),

-- yearBuilt建成年份
('yearBuilt', '竣工、建成、完工、建成年份', '2001、2002、2003、2004、2005、2006、2007、2008、2009、2010、2011、2012、2013、2014、2015、2016、2017、2018、2019、2020、2021、2022、2023、2024、2025'),

-- valuationPrice评估单价
('valuationPrice', '单价、市场单价、元/平方米、元/㎡、价格、估价', '10000、11000、9000、8000、7000、6000、5000、4000、3000、2000、15000、20000'),

-- valueDate价值时点
('valueDate', '价值时点、成交时间、时间、日期', '2024年、2025年、2026年、2027年、2028年'),

-- decorationStatus装修状况
('decorationStatus', '清水、木地板、地砖、装修、装饰', '清水、简装、精装、豪华装、木地板、地砖'),

-- spaceLayout空间布局
('spaceLayout', '室、卫、厨、厅、卧室、卫生间、厨房', '一室、两室、三室、四室、五室、一卫、两卫、三卫、一厨、两厨');



CREATE TABLE LazyBee.dbo.Websites (
    id INT IDENTITY(1,1) PRIMARY KEY,       -- 网站ID，主键
    name NVARCHAR(100) NOT NULL,                   -- 网站名称
    url NVARCHAR(255) NOT NULL,                    -- 网址
    notes NVARCHAR(MAX)                            -- 备注
);


--创建运动减肥数据库
CREATE TABLE SportsApp.dbo.WorkoutRecords (
  id INT IDENTITY(1,1) PRIMARY KEY,          -- ✅ 运动数据id，主键，自增长
  username NVARCHAR(100) NOT NULL,            -- 运动者姓名 
  sportname NVARCHAR(50) NOT NULL,            -- 运动类别
  count INT NOT NULL,                         -- ✅ 完成次数
  durationseconds INT NOT NULL,               -- ✅ 运动时长（秒） 
  groupnumber INT NOT NULL,                   -- ✅ 组别编号
  sportdate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),  -- 运动日期  默认为当天日期
  remarks NVARCHAR(255),  -- 备注，长度为255
);