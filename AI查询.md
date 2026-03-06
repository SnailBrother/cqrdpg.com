
我的数据库WebWordReports.dbo.WordReportsInformation里面的我要使用的字段如下：
    location VARCHAR(255) NOT NULL,                  -- 房产坐落
    buildingArea DECIMAL(10, 2) NOT NULL,            -- 建筑面积，精度为 10 位数，保留 2 位小数
    interiorArea DECIMAL(10, 2) NOT NULL,            -- 套内面积，精度为 10 位数，保留 2 位小数
    communityName VARCHAR(100) NOT NULL,              -- 小区名称
    totalFloors INT NOT NULL,                          -- 总层数
    floorNumber INT NOT NULL,                          -- 所在楼层
    housePurpose VARCHAR(100) NOT NULL,                -- 房屋用途
    elevator BIT NOT NULL,                             -- 电梯（有、无）
    yearBuilt INT NOT NULL,                            -- 建成年份
    valuationPrice DECIMAL(15, 0) NOT NULL,            -- 评估单价 (没有小数)
    valueDate DATE NOT NULL,                         -- 价值时点
    decorationStatus VARCHAR(500) NOT NULL,            -- 装饰装修
    spaceLayout VARCHAR(100) NOT NULL,                 -- 空间布局



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

我现在要实现得目的效果就是，比如说我在前端输入一个问题，这仅仅是一个例子，
比如说我问：Question：现在渝北区的住宅房屋均价怎么样
实现的效果就是：
第一步判断问题是哪种类型，根据用户的Question整个字段判断LIKE '%RealEstateAISearch.dbo.QuestionType.triggerKeyword%' 比如说对应的有triggerKeyword里面的"均价"，这个时候就会知道客户问的问题是comparison，
第二步判断要查询的关键字，根据用户的Question整个字段判断LIKE '%RealEstateAISearch.dbo.SearchKeywords.triggerKeyword%' 比如说对应的有triggerKeyword 里面的"区"，这个时候就会知道客户问的问题是location，，
第二步判断要查询的关键字，根据用户的Question整个字段判断LIKE '%RealEstateAISearch.dbo.SearchKeywords.SearchKeyword%' 比如说对应的有SearchKeyword 里面的"渝北"，这个时候就会知道客户问的问题是SearchKeyword  LIKE '%渝北%' ，
特别注意的是：
1、后端处理涉及到小区的时候，要从WebWordReports.dbo.WordReportsInformation里面拿取小区名
2、处理valuation 这个问题类型的时候，我要先找有没有有没有关键字，有的话就从小区查找，如果没有就从区域均价作为结果
3、实现的原理就是先通过数据库来判断我前端的字段包含哪些数据库的问题，然后再进行查找，有点像反向查找
4、在valuation提问的时候，就先是匹配是否有同小区名，如果没有再用区域均价
5、针对有时间的时候，就是以当前年月为基础，往前合计2年

前端返回我要的结果效果是：
第一种comparison区域房价对比 ：
序号	对比区域	房源数量	平均评估单价	平均建筑面积	平均套内面积	最低单价	最高单价	平均建成年份
1	江北	2	10300	78.89	63.12	9600	11000	2015
2	渝北	6	9378	101.2	82.04	2670	11800	2015
第二种statistics提取详细房源
序号	房产坐落	建筑面积	套内面积	小区名称	总层数	所在楼层	房屋用途	有无电梯	建成年份	评估单价	价值时点	装修状况	空间布局
1	巴南区李家沱融汇大道3号13幢2单元5-2	176.14	0	香缇卡纳	6	5	成套住宅	否	2010	7300	2025-12-26	入户门防盗门，铝合金窗；室内清水	空间布局合理
2	巴南区渝南大道130号2幢3-3	129.33	109.02	宗申·动力城	32	3	成套住宅	是	2011	6800	2025-11-19	入户门防盗门，铝合金窗；室内客厅地面地砖，墙面墙漆，天棚吊顶，卧室地面地砖，墙面墙漆，天棚刷漆，厨卫：地面地砖，墙砖到顶，扣板吊顶	三室两厅两卫一厨
第三种trend价格趋势变化
序号	年月	委托数量	月均评估单价	月均建筑面积	月度最低单价	月度最高单价
1	2026-01	1	4100	100.96	4100	4100
2	2025-12	6	6158	121.39	2400	10050
3	2025-11	11	6723	104.18	943	14900
4	2025-10	4	10300	123.84	8100	12000
5	2025-09	5	9560	196.95	7200	11000
6	2025-08	9	8063	91.89	2670	11800
7	2025-07	2	8650	111.42	4300	13000
第四种valuation房屋单价咨询
• 价格范围：8100 - 8100 元/平米
• 平均价格：8100 元/平米
• 平均面积：66.7 平米
请把完整的后端/api/ai-query给我