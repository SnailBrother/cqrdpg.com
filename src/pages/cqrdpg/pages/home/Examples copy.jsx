import React, { useState } from 'react';
import styles from './Examples.module.css';

const Examples = () => {
  // 状态管理各个分类的展开/折叠
  const [expandedSections, setExpandedSections] = useState({
    expropriation: true,  // 默认展开第一个
    land: false,
    asset: false,
    judicial: false
  });

  // 状态管理资产评估的子分类展开/折叠
  const [expandedSubSections, setExpandedSubSections] = useState({
    enterpriseReform: false,
    bankruptcyLiquidation: false,
    enterpriseValue: false,
    debtValue: false,
    other: false
  });

  // 切换主分类
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 切换子分类
  const toggleSubSection = (subSection) => {
    setExpandedSubSections(prev => ({
      ...prev,
      [subSection]: !prev[subSection]
    }));
  };

  // 征收（拆迁）评估案例数据
  const expropriationCases = [
    "渝中区十八梯危旧房改造、土地整治储备拆迁项目",
    "渝中区千厮门大桥(渝中段)一标段拆迁项目",
    "南岸区东水门大桥南立交工程征收项目",
    "南岸区轨道交通环线莲花村站至上新街站征收项目",
    "南岸区广阳岛交通改造征收项目",
    "九龙坡中梁山隧道扩容改造工程征收项目",
    "九龙坡区嘉华大桥南北干道征收项目",
    "渝黔铁路上桥段及重庆西站综合交通枢纽项目",
    "渝中区大黄路旧城区改建征收项目",
    "江北区观音桥组团地块(G17-3/02)旧城改造征收项目",
    "江北区溉澜溪征收项目",
    "江北猫儿石一、五、七片区拆迁项目",
    "江北寸滩集装箱物流中心项目",
    "江北珠江太阳城拆迁项目",
    "江北区寸滩黑石子危旧房片区项目",
    "江北区肥皂厂片区旧城改造征收项目",
    "渝北区'观音岩扩大片区棚户区（危旧房）改造'",
    "南岸区的五桂石片区阳光100国际新城棚户区改造征收项目",
    "南岸区弹子石中央商务区(3、5号地块)拆迁项目",
    "南岸区弹子石区三、四、五期危旧房改造项目",
    "南岸区弹子石朝天门长江大桥拆迁项目",
    "南岸区万达场一期B区拆迁项目",
    "南岸铜元局片区房屋拆迁项目",
    "九龙坡轮胎厂家属区旧城改建房屋征收项目",
    "九龙坡歇台子旧城改造征收项目",
    "大渡口袁茄路二、三期拆迁项目",
    "巴南区花溪王家坝片区（一）旧城改建项目",
    "巴南花溪王家坝旧城改造征收项目",
    "嘉陵江磁井段防洪护岸综合整治项目",
    "磁器口金碧正街项目",
    "璧山绿岛新区教育基础设施建设征收项目",
    "璧山青杠街道绿化广场征收项目",
    "璧山交职校整治拆迁项目",
    "彭水县汉葭镇滨江社区房屋项目",
    "彭水县金山广场旧城改造房屋征收的项目",
    "綦江陵园小学分校建设房屋征收项目",
    "綦江火车站片区-期征收项目",
    "南川区林产公司片区征收项目",
    "石柱'棉花坝、藏经寺、体育场片区旧城改造'征收项目",
    "城口太和场集中仓库旧城改造征收项目",
    "永川玉屏山片区城市房屋拆迁项目"
  ];

  // 土地评估项目数据
  const landCases = [
    "重庆市自然资源利用事务中心委估土地的收储，收购，出让底价以及成本价格评估",
    "重庆市江津区土地储备中心委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆市永川区规划和自然资源局委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆忠县规划和自然资源局委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆大足规划和自然资源局委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆黔江区规划和自然资源委估的土地的收储，收购，出让底价以及成本价格评估",
    "重庆万盛经济技术开发区国土房管局委估的土地的收储，收购，出让底价以及成本价格评估",
    "入围建行、工行、农行、三峡银行、大连银行、哈尔滨银行、中德银行、南粤银行等银行的土地抵押评估",
    "各大企业资产入账，处置等涉及的土地价格评估",
    "土地租金价格评估"
  ];

  // 资产评估项目数据
  const assetCases = {
    enterpriseReform: [
      "重庆食品工业研究所企业改制评估项目",
      "四川渝建研建设工程质量检测有限责任公司企业改制评估项目",
      "重庆市建拓工程造价咨询有限公司企业改制评估项目",
      "重庆建筑科学研究院企业改制评估项目",
      "重庆市建科工程技术有限公司企业改制评估项目",
      "重庆市建设工程质量检验测试中心企业改制评估项目",
      "忠县园艺场企业改制评估项目"
    ],
    bankruptcyLiquidation: [
      "重庆流云房地产开发有限公司破产清算评估项目",
      "重庆市农产品集团云阳农产品市场有限公司破产清算评估项目",
      "重庆市馨葳机械制造有限公司破产清算评估项目",
      "重庆云河水电股份有限公司破产清算评估项目"
    ],
    enterpriseValue: [
      "重庆长江塑料编织厂整体价值评估项目",
      "重庆药用包装容器厂整体价值评估项目",
      "重庆浦渝投资管理有限公司整体价值评估项目",
      "重庆小型自动化装置厂整体价值评估项目",
      "重庆市聚鑫机动车驾驶培训学校整体价值评估项目"
    ],
    debtValue: [
      "处置重庆三江羽绒（集团）有限公司债权价值评估项目",
      "处置重庆华创药业有限公司债权价值评估项目",
      "处置重庆融创园林景观设计工程有限公司债权价值评估项目",
      "处置重庆铭嘉实业有限公司债权价值评估项目",
      "处置重庆缤淘商贸有限公司债权价值评估项目",
      "处置重庆市白沙地产开发集团有限公司债权价值评估项目",
      "处置重庆智力建筑安装工程有限公司债权价值评估项目"
    ],
    other: [
      "中国石油天然气股份有限公司委估中卫-贵阳联络线工程（重庆段、贵州段）压覆相关矿业资产评估项目",
      "重庆紫光天原化工有限责任公司拟对外投资评估项目",
      "重庆川仪自动化股份有限公司拟处置资产评估项目",
      "重庆市江津区国有资产管理中心拟协议转让资产评估项目",
      "重庆市铜梁区卫生和计划生育委员会拟划转资产评估项目"
    ]
  };

  // 司法鉴定评估数据
  const judicialCases = [
    "重庆市第五中级人民法院拟执行隆鑫控股有限公司持有的重庆农村商业银行1500万股社会法人股司法鉴定评估项目",
    "重庆市第一中级人民法院受理的成都银行股份有限公司重庆分行与被执行人涉及商业体司法鉴定评估项目",
    "重庆市第五中级人民法院拟执行重庆长寿晏家河泉南路1号所在地块土地用途为工业用地红线范围内厂区的整体现状司法鉴定评估项目"
  ];

  return (
    <section className={styles.examplesSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>评估项目</h2>
        <p className={styles.sectionSubtitle}>我们以专业的水准完成各种复杂、大型的评估项目</p>

        <div className={styles.contentWrapper}>
            {/* 主分类标签 */}
          {/* 1. 征收（拆迁）评估 */}
          <div className={styles.categoryBlock}>
            <div 
              className={styles.categoryHeader}
              onClick={() => toggleSection('expropriation')}
            >
              <div className={styles.categoryTitleWrapper}>
                <span className={styles.categoryNumber}>01</span>
                <h3 className={styles.categoryTitle}>征收（拆迁）评估</h3>
              </div>
              <span className={`${styles.expandIcon} ${expandedSections.expropriation ? styles.expanded : ''}`}>
                ▼
              </span>
            </div>
            
            {expandedSections.expropriation && (
              <div className={styles.categoryContent}>
                <p className={styles.categoryDesc}>
                  执业人员均经过国家从业资格认证，具有丰富的理论知识和长期的实践经验，
                  以高专业的水准完成各种复杂、大型的房屋征收评估。目前公司已参与并完成了多起征收（拆迁）评估工作，部分项目展示如下：
                </p>
                <ul className={styles.caseList}>
                  {expropriationCases.map((item, index) => (
                    <li key={index} className={styles.caseItem}>{item}</li>
                  ))}
                </ul>
                <div className={styles.moreIndicator}>......</div>
              </div>
            )}
          </div>

          {/* 2. 土地评估项目 */}
          <div className={styles.categoryBlock}>
            <div 
              className={styles.categoryHeader}
              onClick={() => toggleSection('land')}
            >
              <div className={styles.categoryTitleWrapper}>
                <span className={styles.categoryNumber}>02</span>
                <h3 className={styles.categoryTitle}>土地评估项目</h3>
              </div>
              <span className={`${styles.expandIcon} ${expandedSections.land ? styles.expanded : ''}`}>
                ▼
              </span>
            </div>
            
            {expandedSections.land && (
              <div className={styles.categoryContent}>
                <p className={styles.categoryDesc}>
                  长期以来，本公司与重庆市各区县国土房屋等相关部门有着良好的合作，为其提供了优质高效的服务。近年估价师完成项目类型展示：
                </p>
                <ul className={styles.caseList}>
                  {landCases.map((item, index) => (
                    <li key={index} className={styles.caseItem}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 3. 资产评估项目 */}
          <div className={styles.categoryBlock}>
            <div 
              className={styles.categoryHeader}
              onClick={() => toggleSection('asset')}
            >
              <div className={styles.categoryTitleWrapper}>
                <span className={styles.categoryNumber}>03</span>
                <h3 className={styles.categoryTitle}>资产评估项目</h3>
              </div>
              <span className={`${styles.expandIcon} ${expandedSections.asset ? styles.expanded : ''}`}>
                ▼
              </span>
            </div>
            
            {expandedSections.asset && (
              <div className={styles.categoryContent}>
                {/* 企业改制评估 */}
                <div className={styles.subCategoryBlock}>
                  <div 
                    className={styles.subCategoryHeader}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubSection('enterpriseReform');
                    }}
                  >
                    <h4 className={styles.subCategoryTitle}>企业改制评估</h4>
                    <span className={`${styles.subExpandIcon} ${expandedSubSections.enterpriseReform ? styles.expanded : ''}`}>
                      ▼
                    </span>
                  </div>
                  {expandedSubSections.enterpriseReform && (
                    <ul className={styles.caseList}>
                      {assetCases.enterpriseReform.map((item, index) => (
                        <li key={index} className={styles.caseItem}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 企业破产清算评估 */}
                <div className={styles.subCategoryBlock}>
                  <div 
                    className={styles.subCategoryHeader}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubSection('bankruptcyLiquidation');
                    }}
                  >
                    <h4 className={styles.subCategoryTitle}>企业破产清算评估</h4>
                    <span className={`${styles.subExpandIcon} ${expandedSubSections.bankruptcyLiquidation ? styles.expanded : ''}`}>
                      ▼
                    </span>
                  </div>
                  {expandedSubSections.bankruptcyLiquidation && (
                    <ul className={styles.caseList}>
                      {assetCases.bankruptcyLiquidation.map((item, index) => (
                        <li key={index} className={styles.caseItem}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 企业整体价值评估 */}
                <div className={styles.subCategoryBlock}>
                  <div 
                    className={styles.subCategoryHeader}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubSection('enterpriseValue');
                    }}
                  >
                    <h4 className={styles.subCategoryTitle}>企业整体价值评估</h4>
                    <span className={`${styles.subExpandIcon} ${expandedSubSections.enterpriseValue ? styles.expanded : ''}`}>
                      ▼
                    </span>
                  </div>
                  {expandedSubSections.enterpriseValue && (
                    <ul className={styles.caseList}>
                      {assetCases.enterpriseValue.map((item, index) => (
                        <li key={index} className={styles.caseItem}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 债权价值评估项目 */}
                <div className={styles.subCategoryBlock}>
                  <div 
                    className={styles.subCategoryHeader}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubSection('debtValue');
                    }}
                  >
                    <h4 className={styles.subCategoryTitle}>债权价值评估项目</h4>
                    <span className={`${styles.subExpandIcon} ${expandedSubSections.debtValue ? styles.expanded : ''}`}>
                      ▼
                    </span>
                  </div>
                  {expandedSubSections.debtValue && (
                    <ul className={styles.caseList}>
                      {assetCases.debtValue.map((item, index) => (
                        <li key={index} className={styles.caseItem}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 其他资产评估项目 */}
                <div className={styles.subCategoryBlock}>
                  <div 
                    className={styles.subCategoryHeader}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubSection('other');
                    }}
                  >
                    <h4 className={styles.subCategoryTitle}>其他资产评估项目</h4>
                    <span className={`${styles.subExpandIcon} ${expandedSubSections.other ? styles.expanded : ''}`}>
                      ▼
                    </span>
                  </div>
                  {expandedSubSections.other && (
                    <ul className={styles.caseList}>
                      {assetCases.other.map((item, index) => (
                        <li key={index} className={styles.caseItem}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. 司法鉴定评估 */}
          <div className={styles.categoryBlock}>
            <div 
              className={styles.categoryHeader}
              onClick={() => toggleSection('judicial')}
            >
              <div className={styles.categoryTitleWrapper}>
                <span className={styles.categoryNumber}>04</span>
                <h3 className={styles.categoryTitle}>司法鉴定评估</h3>
              </div>
              <span className={`${styles.expandIcon} ${expandedSections.judicial ? styles.expanded : ''}`}>
                ▼
              </span>
            </div>
            
            {expandedSections.judicial && (
              <div className={styles.categoryContent}>
                <p className={styles.categoryDesc}>
                  本公司经全国最高人民法院批准的重庆市司法评估机构资质，为重庆各法院提供高效优质的服务，
                  部分估价师荣获重庆市优秀司法鉴定人。
                </p>
                <ul className={styles.caseList}>
                  {judicialCases.map((item, index) => (
                    <li key={index} className={styles.caseItem}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Examples;