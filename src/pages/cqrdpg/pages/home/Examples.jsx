import React, { useState, useRef, useEffect } from 'react';
import styles from './Examples.module.css';

const Examples = () => {
  // 一级分类状态
  const [activeMainCategory, setActiveMainCategory] = useState('expropriation');
  
  // 二级分类状态 (默认选中第一个子项)
  const [activeSubCategory, setActiveSubCategory] = useState('enterpriseReform');

  // 内容区域引用，用于切换时滚动到顶部
  const contentRef = useRef(null);

  // 切换一级分类时，重置滚动条并处理二级分类默认值
  const handleMainCategoryChange = (category) => {
    if (activeMainCategory === category) return;
    
    setActiveMainCategory(category);
    
    // 如果切换到资产评估，且当前没有选中的子项，默认选中第一个
    if (category === 'asset') {
      setActiveSubCategory('enterpriseReform');
    }
    
    // 切换后滚动到内容区顶部
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }, 50);
  };

  // 切换二级分类
  const handleSubCategoryChange = (subCategory) => {
    setActiveSubCategory(subCategory);
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }, 50);
  };

  // --- 数据定义 (保持不变) ---
  const expropriationCases = [
    "渝中区十八梯危旧房改造、土地整治储备拆迁项目", "渝中区千厮门大桥(渝中段)一标段拆迁项目",
    "南岸区东水门大桥南立交工程征收项目", "南岸区轨道交通环线莲花村站至上新街站征收项目",
    "南岸区广阳岛交通改造征收项目", "九龙坡中梁山隧道扩容改造工程征收项目",
    "九龙坡区嘉华大桥南北干道征收项目", "渝黔铁路上桥段及重庆西站综合交通枢纽项目",
    "渝中区大黄路旧城区改建征收项目", "江北区观音桥组团地块(G17-3/02)旧城改造征收项目",
    "江北区溉澜溪征收项目", "江北猫儿石一、五、七片区拆迁项目",
    "江北寸滩集装箱物流中心项目", "江北珠江太阳城拆迁项目",
    "江北区寸滩黑石子危旧房片区项目", "江北区肥皂厂片区旧城改造征收项目",
    "渝北区'观音岩扩大片区棚户区（危旧房）改造'", "南岸区的五桂石片区阳光100国际新城棚户区改造征收项目",
    "南岸区弹子石中央商务区(3、5号地块)拆迁项目", "南岸区弹子石区三、四、五期危旧房改造项目",
    "南岸区弹子石朝天门长江大桥拆迁项目", "南岸区万达场一期B区拆迁项目",
    "南岸铜元局片区房屋拆迁项目", "九龙坡轮胎厂家属区旧城改建房屋征收项目",
    "九龙坡歇台子旧城改造征收项目", "大渡口袁茄路二、三期拆迁项目",
    "巴南区花溪王家坝片区（一）旧城改建项目", "巴南花溪王家坝旧城改造征收项目",
    "嘉陵江磁井段防洪护岸综合整治项目", "磁器口金碧正街项目",
    "璧山绿岛新区教育基础设施建设征收项目", "璧山青杠街道绿化广场征收项目",
    "璧山交职校整治拆迁项目", "彭水县汉葭镇滨江社区房屋项目",
    "彭水县金山广场旧城改造房屋征收的项目", "綦江陵园小学分校建设房屋征收项目",
    "綦江火车站片区 - 期征收项目", "南川区林产公司片区征收项目",
    "石柱'棉花坝、藏经寺、体育场片区旧城改造'征收项目", "城口太和场集中仓库旧城改造征收项目",
    "永川玉屏山片区城市房屋拆迁项目"
  ];

  const landCases = [
    "重庆市自然资源利用事务中心委估土地的收储，收购，出让底价以及成本价格评估",
    "重庆市江津区土地储备中心委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆市永川区规划和自然资源局委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆忠县规划和自然资源局委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆大足规划和自然资源局委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆黔江区规划和自然资源委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆万盛经济技术开发区国土房管局委估的土地的收储，收购，出让底价以及成本价格评估",
    "入围建行、工行、农行、三峡银行、大连银行、哈尔滨银行、中德银行、南粤银行等银行的土地抵押评估",
    "各大企业资产入账，处置等涉及的土地价格评估", "土地租金价格评估"
  ];

  const assetCases = {
    enterpriseReform: [
      "重庆食品工业研究所企业改制评估项目", "四川渝建研建设工程质量检测有限责任公司企业改制评估项目",
      "重庆市建拓工程造价咨询有限公司企业改制评估项目", "重庆建筑科学研究院企业改制评估项目",
      "重庆市建科工程技术有限公司企业改制评估项目", "重庆市建设工程质量检验测试中心企业改制评估项目",
      "忠县园艺场企业改制评估项目"
    ],
    bankruptcyLiquidation: [
      "重庆流云房地产开发有限公司破产清算评估项目", "重庆市农产品集团云阳农产品市场有限公司破产清算评估项目",
      "重庆市馨葳机械制造有限公司破产清算评估项目", "重庆云河水电股份有限公司破产清算评估项目"
    ],
    enterpriseValue: [
      "重庆长江塑料编织厂整体价值评估项目", "重庆药用包装容器厂整体价值评估项目",
      "重庆浦渝投资管理有限公司整体价值评估项目", "重庆小型自动化装置厂整体价值评估项目",
      "重庆市聚鑫机动车驾驶培训学校整体价值评估项目"
    ],
    debtValue: [
      "处置重庆三江羽绒（集团）有限公司债权价值评估项目", "处置重庆华创药业有限公司债权价值评估项目",
      "处置重庆融创园林景观设计工程有限公司债权价值评估项目", "处置重庆铭嘉实业有限公司债权价值评估项目",
      "处置重庆缤淘商贸有限公司债权价值评估项目", "处置重庆市白沙地产开发集团有限公司债权价值评估项目",
      "处置重庆智力建筑安装工程有限公司债权价值评估项目"
    ],
    other: [
      "中国石油天然气股份有限公司委估中卫 - 贵阳联络线工程（重庆段、贵州段）压覆相关矿业资产评估项目",
      "重庆紫光天原化工有限责任公司拟对外投资评估项目", "重庆川仪自动化股份有限公司拟处置资产评估项目",
      "重庆市江津区国有资产管理中心拟协议转让资产评估项目", "重庆市铜梁区卫生和计划生育委员会拟划转资产评估项目"
    ]
  };

  const judicialCases = [
    "重庆市第五中级人民法院拟执行隆鑫控股有限公司持有的重庆农村商业银行1500万股社会法人股司法鉴定评估项目",
    "重庆市第一中级人民法院受理的成都银行股份有限公司重庆分行与被执行人涉及商业体司法鉴定评估项目",
    "重庆市第五中级人民法院拟执行重庆长寿晏家河泉南路1号所在地块土地用途为工业用地红线范围内厂区的整体现状司法鉴定评估项目"
  ];

  // 辅助函数：获取当前显示的内容列表
  const getCurrentCases = () => {
    if (activeMainCategory === 'expropriation') return { title: '征收（拆迁）评估案例', desc: '瑞达评估公司的执业人员均经过国家从业资格认证，具有丰富的理论知识和长期的实践经验，以高专业的水准完成各种复杂、大型的房屋征收评估。目前公司已参与并完成了多起征收（拆迁）评估工作，部分项目展示如下：', list: expropriationCases };
    if (activeMainCategory === 'land') return { title: '土地评估项目', desc: '长期以来，本公司与重庆市各区县国土房屋等相关部门有着良好的合作，为其提供了优质高效的服务。近年估价师完成项目类型展示：', list: landCases };
    if (activeMainCategory === 'judicial') return { title: '司法鉴定评估', desc: '本公司经全国最高人民法院批准的重庆市司法评估机构资质，为重庆各法院提供高效优质的服务，部分估价师荣获重庆市优秀司法鉴定人。', list: judicialCases };
    
    // 资产评估逻辑
    if (activeMainCategory === 'asset') {
      const subMap = {
        enterpriseReform: '企业改制评估',
        bankruptcyLiquidation: '企业破产清算评估',
        enterpriseValue: '企业整体价值评估',
        debtValue: '债权价值评估项目',
        other: '其他资产评估项目'
      };
      return { 
        title: subMap[activeSubCategory], 
        desc: `以下是关于 ${subMap[activeSubCategory]} 的部分代表性案例：`, 
        list: assetCases[activeSubCategory] 
      };
    }
    return { list: [] };
  };

  const currentData = getCurrentCases();

  return (
    <section className={styles.examplesSection}>
      <div className={styles.container}>
        {/* 头部标题 */}
        <div className={styles.headerArea}>
          <h2 className={styles.sectionTitle}>企业案例</h2>
          <p className={styles.sectionSubtitle}>我们以专业的水准完成各种复杂、大型的评估项目</p>
        </div>

        {/* 主体布局：左侧导航 + 右侧内容 */}
        <div className={styles.mainLayout}>
          
          {/* 左侧导航栏 (Sidebar) */}
          <aside className={styles.sidebar}>
            <nav className={styles.navList}>
              {/* 一级菜单项 */}
              <div 
                className={`${styles.navItem} ${activeMainCategory === 'expropriation' ? styles.active : ''}`}
                onClick={() => handleMainCategoryChange('expropriation')}
              >
                <span className={styles.navNumber}>01</span>
                <span className={styles.navText}>征收（拆迁）评估</span>
              </div>

              <div 
                className={`${styles.navItem} ${activeMainCategory === 'land' ? styles.active : ''}`}
                onClick={() => handleMainCategoryChange('land')}
              >
                <span className={styles.navNumber}>02</span>
                <span className={styles.navText}>土地评估项目</span>
              </div>

              {/* 带二级菜单的一级项：资产评估 */}
              <div className={styles.navGroup}>
                <div 
                  className={`${styles.navItem} ${activeMainCategory === 'asset' ? styles.active : ''}`}
                  onClick={() => handleMainCategoryChange('asset')}
                >
                  <span className={styles.navNumber}>03</span>
                  <span className={styles.navText}>资产评估项目</span>
                  <span className={styles.arrowIcon}>{activeMainCategory === 'asset' ? '▲' : '▼'}</span>
                </div>
                
                {/* 二级菜单 (仅当一级选中时显示) */}
                {activeMainCategory === 'asset' && (
                  <div className={styles.subNavList}>
                    <div 
                      className={`${styles.subNavItem} ${activeSubCategory === 'enterpriseReform' ? styles.active : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSubCategoryChange('enterpriseReform'); }}
                    >
                      企业改制评估
                    </div>
                    <div 
                      className={`${styles.subNavItem} ${activeSubCategory === 'bankruptcyLiquidation' ? styles.active : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSubCategoryChange('bankruptcyLiquidation'); }}
                    >
                      企业破产清算评估
                    </div>
                    <div 
                      className={`${styles.subNavItem} ${activeSubCategory === 'enterpriseValue' ? styles.active : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSubCategoryChange('enterpriseValue'); }}
                    >
                      企业整体价值评估
                    </div>
                    <div 
                      className={`${styles.subNavItem} ${activeSubCategory === 'debtValue' ? styles.active : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSubCategoryChange('debtValue'); }}
                    >
                      债权价值评估项目
                    </div>
                    <div 
                      className={`${styles.subNavItem} ${activeSubCategory === 'other' ? styles.active : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleSubCategoryChange('other'); }}
                    >
                      其他资产评估项目
                    </div>
                  </div>
                )}
              </div>

              <div 
                className={`${styles.navItem} ${activeMainCategory === 'judicial' ? styles.active : ''}`}
                onClick={() => handleMainCategoryChange('judicial')}
              >
                <span className={styles.navNumber}>04</span>
                <span className={styles.navText}>司法鉴定评估</span>
              </div>
            </nav>
          </aside>

          {/* 右侧内容区域 (Content Area) */}
          <main className={styles.contentArea} ref={contentRef}>
            <div className={styles.contentInner}>
              <h3 className={styles.contentTitle}>{currentData.title}</h3>
              {currentData.desc && (
                <div className={styles.contentDescBox}>
                  <p className={styles.contentDesc}>{currentData.desc}</p>
                </div>
              )}
              
              <ul className={styles.caseGrid}>
                {currentData.list && currentData.list.map((item, index) => (
                  <li key={index} className={styles.caseCard}>
                    <span className={styles.cardDot}></span>
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className={styles.endIndicator}>—— ...... ——</div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default Examples;