我想要用react结合sql server写一个网页，其中我的具体要求如下： 
前端要用Project.js和Project.module.css 前端要求可以对数据进行增删改查，以及批量上传数据（把excel中的数据上传到数据库） 
其中我的后端有两个数据库，一个是字段数据库，另一个是字段对应的数据库， 
字段数据库如下： 
Project.dbo.ProjectOption 
英文字段名 中文字段名 数据类型 备注
 ProjectID 项目
id INT PRIMARY KEY 项目唯一标识符 
ProjectName 项目名称 NVARCHAR(100) 
项目名称 ProjectUser 
项目负责人 NVARCHAR(100) 
项目负责人 Date 项目时间 
DATE 项目时间 Price 
项目金额 DECIMAL(10, 2) 项目金额 
.................等等 

数据库数据如下： 
Project.dbo.ProjectData 
ProjectID ProjectName ProjectUser Date Price 
1 南岸区租金评估 张三 2025-05-06 1500.26 
2 巴南区租金评估 李四 2026-05-06 2500.00 
.....................等等 

在Project.js里面我要操作数据的时候使用 
const response = await axios.get('/api/getProject', { 
const response = await axios.get('/api/updateProject', { 
const response = await axios.get('/api/addProject', { 
const response = await axios.get('/api/deleteProject', {
 ........................ 
在后端的话，使用 
app.get('/api/getProject', async (req, res) => { 
app.post('/api/addProject', async (req, res) => { 
app.delete('/api/deleteProject', async (req, res) => { 
app.put('/api/updateProject', async (req, res) => { 
但是我的要有一个要求，我的后端和前端都不需要出现具体的字段，我全部通过 
const response = await axios.get('/api/getProject', { SELECT * FROM Project.dbo.ProjectOption 这种方向来实现灵活的处理数据，这样我增加删除等操作，
我只需要操作Project.dbo.ProjectOption这个数据库就行了

 

CREATE TABLE Project.dbo.ProjectOption (
    FieldID INT PRIMARY KEY,
    EnglishName NVARCHAR(50),    -- 英文字段名
    ChineseName NVARCHAR(50),    -- 中文字段名
    DataType NVARCHAR(50),       -- 数据类型
    IsRequired BIT DEFAULT 0,    -- 是否必填
    DefaultValue NVARCHAR(255),  -- 默认值
    ValidationRule NVARCHAR(MAX), -- 验证规则（JSON格式）
    DisplayOrder INT,            -- 显示顺序
    IsVisible BIT DEFAULT 1,     -- 是否可见
    IsEditable BIT DEFAULT 1,    -- 是否可编辑
    CreatedDate DATETIME DEFAULT GETDATE()
)


我的后端已经有基础配置如下：
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const xlsx = require('xlsx');
const app = express();
const port = 5202;
const { PDFDocument } = require('pdf-lib');

// SQL Server 配置
const config = {
    user: 'sa',
    password: 'Alan944926',
    server: '121.4.22.55',
    database: 'BillingApp',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        pool: {
            max: 100, // 连接池最大连接数
            min: 0,  // 最小连接数
            idleTimeoutMillis: 30000 // 空闲连接超时时间
        }

    }
};

//使用全局连接池 这是最佳实践 搜索哪些使用了这个，直接关键字搜索：使用全局连接池 这是最佳实践 👇 2.1
//不需要手动关闭连接，连接池会自动管理
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect(); // 启动连接但不等待
// 确保应用启动时连接成功
poolConnect.then(() => {
    console.log('Connected to SQL Server');
}).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});
//使用全局连接池 这是最佳实践 搜索哪些使用了这个，直接关键字搜索：使用全局连接池 这是最佳实践 👆 2.1


//实时接受消息 socket.io

const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});


//下载
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

//图片上传
//const express = require("express");
const multer = require("multer");
//const fs = require("fs");
//const path = require("path");

const JSZip = require('jszip');  // 添加这行 JSZip 但没有正确导

app.use(cors());
app.use(express.json()); // 解析 JSON 请求体



// 根路径处理
app.get('/', (req, res) => {
    res.send('API is running...');
});


// 启动服务器
http.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


现在给出我的前端Project.js和Project.module.css，然后给出后端的api
CREATE TABLE ProjectDatabase.dbo.ProjectOption (
    FieldID INT IDENTITY(1,1) PRIMARY KEY,
    EnglishName NVARCHAR(50) NOT NULL,    -- 英文字段名
    ChineseName NVARCHAR(50) NOT NULL,    -- 中文字段名
    DataType NVARCHAR(50) NOT NULL,       -- 数据类型
    IsRequired BIT DEFAULT 0,             -- 是否必填
    DefaultValue NVARCHAR(255),           -- 默认值
    ValidationRule NVARCHAR(MAX),         -- 验证规则
    DisplayOrder INT DEFAULT 0,           -- 显示顺序
    IsVisible BIT DEFAULT 1,              -- 是否可见
    IsEditable BIT DEFAULT 1,             -- 是否可编辑
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- 创建项目数据表
CREATE TABLE ProjectDatabase.dbo.ProjectData (
    ProjectID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName NVARCHAR(100) NOT NULL,
    ProjectUser NVARCHAR(100) NOT NULL,
    Date DATE NOT NULL,
    Price DECIMAL(10, 2) NOT NULL
);
GO


-- 插入字段定义
INSERT INTO ProjectDatabase.dbo.ProjectOption (EnglishName, ChineseName, DataType, IsRequired, DisplayOrder, IsVisible, IsEditable) VALUES
('ProjectID', '项目ID', 'INT', 1, 1, 1, 0),
('ProjectName', '项目名称', 'NVARCHAR(100)', 1, 2, 1, 1),
('ProjectUser', '项目负责人', 'NVARCHAR(100)', 1, 3, 1, 1),
('Date', '项目时间', 'DATE', 1, 4, 1, 1),
('Price', '项目金额', 'DECIMAL(10,2)', 1, 5, 1, 1);
GO

-- 插入项目数据
INSERT INTO ProjectDatabase.dbo.ProjectData (ProjectName, ProjectUser, Date, Price) VALUES
('南岸区租金评估', '张三', '2025-05-06', 1500.26),
('巴南区租金评估', '李四', '2026-05-06', 2500.00),
('渝中区商业评估', '王五', '2025-08-15', 3200.50),
('江北区房产评估', '赵六', '2025-11-20', 1800.75),
('沙坪坝区土地评估', '钱七', '2025-03-10', 4200.00),
('九龙坡区资产评估', '孙八', '2025-09-25', 2900.30),
('大渡口区物业评估', '周九', '2025-12-05', 1600.80),
('北碚区厂房评估', '吴十', '2025-07-18', 3800.45),
('渝北区商铺评估', '郑十一', '2025-04-22', 2100.90),
('南岸区住宅评估', '王十二', '2025-10-30', 1900.60);
GO
