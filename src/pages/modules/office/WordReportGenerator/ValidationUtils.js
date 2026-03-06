/**
 * 验证房地产评估报告数据
 * @param reportData 报告数据对象
 * @returns 验证结果 { isValid: boolean, missingFields: string[], invalidFields: string[] }
 */
const validateReportData = (reportData) => {
    // 定义必填字段及其验证规则
    const validationRules = [
        { field: 'documentNo', name: '委托书号', maxLength: 50 },
        { field: 'entrustDate', name: '委托日期', type: 'date' },
        { field: 'entrustingParty', name: '委托方', maxLength: 100 },
        { field: 'assessmentCommissionDocument', name: '委托文书', maxLength: 255 },
        { field: 'valueDateRequirements', name: '价值时点要求', maxLength: 500 },
        { field: 'location', name: '房产坐落', maxLength: 255 },
        { field: 'buildingArea', name: '建筑面积', type: 'number' },
        { field: 'interiorArea', name: '套内面积', type: 'number' },
        { field: 'valueDate', name: '价值时点', type: 'date' },
        { field: 'reportDate', name: '报告日期', type: 'date' },
        { field: 'appraiserNameA', name: '估价师A姓名', maxLength: 50 },
        { field: 'appraiserRegNoA', name: '估价师A注册号', maxLength: 50 },
        { field: 'appraiserNameB', name: '估价师B姓名', maxLength: 50 },
        { field: 'appraiserRegNoB', name: '估价师B注册号', maxLength: 50 },
        { field: 'communityName', name: '小区名称', maxLength: 100 },
        { field: 'totalFloors', name: '总层数', type: 'integer' },
        { field: 'floorNumber', name: '所在楼层', type: 'integer' },
        { field: 'housePurpose', name: '房屋用途', maxLength: 100 },
        { field: 'propertyUnitNo', name: '不动产单元号', maxLength: 50 },
        { field: 'rightsHolder', name: '权利人', maxLength: 100 },
        { field: 'landPurpose', name: '土地用途', maxLength: 100 },
        { field: 'sharedLandArea', name: '共有宗地面积', type: 'number' },
        { field: 'landUseRightEndDate', name: '土地使用权终止日期', type: 'date' },
        { field: 'houseStructure', name: '房屋结构', maxLength: 100 },
        { field: 'coOwnershipStatus', name: '共有情况', maxLength: 100 },
        { field: 'rightsNature', name: '权利性质', maxLength: 50 },
        { field: 'elevator', name: '电梯', type: 'boolean' },
        { field: 'decorationStatus', name: '装饰装修', maxLength: 100 },
        { field: 'ventilationStatus', name: '通气', type: 'boolean' },
        { field: 'spaceLayout', name: '空间布局', maxLength: 100 },
        { field: 'exteriorWallMaterial', name: '外墙面', maxLength: 100 },
        { field: 'yearBuilt', name: '建成年份', type: 'integer' },
        { field: 'boundaries', name: '四至', maxLength: 255 },
        { field: 'valuationMethod', name: '估价方法', maxLength: 100 },
        { field: 'propertyCertificateNo', name: '产权证号', maxLength: 50 },
        { field: 'projectID', name: '项目编号', maxLength: 50 },
        { field: 'reportID', name: '报告编号', maxLength: 50 },
        { field: 'valuationPrice', name: '评估单价', maxLength: 6 },
        { field: 'landShape', name: '土地形状', maxLength: 500 },
        { field: 'streetStatus', name: '临街状况', maxLength: 500 },
        { field: 'direction', name: '方位', maxLength: 500 },
        { field: 'orientation', name: '客厅朝向', maxLength: 500 },
        { field: 'distance', name: '重要场所距离', maxLength: 500 },
        { field: 'parkingStatus', name: '停车状况', maxLength: 500 },
        { field: 'mortgageStatus', name: '抵押状况', type: 'boolean' },
        { field: 'seizureStatus', name: '查封状况', type: 'boolean' },
        { field: 'mortgageBasis', name: '抵押依据', maxLength: 500 },
        { field: 'seizureBasis', name: '查封依据', maxLength: 500 }
    ];

    const missingFields = [];
    const invalidFields = [];

    validationRules.forEach(({ field, name, maxLength, type }) => {
        const value = reportData[field];

        // 检查是否为空
        if (value === '' || value === null || value === undefined) {
            missingFields.push(name);
            return;
        }

        // 检查类型
        if (type === 'number' && isNaN(Number(value))) {
            invalidFields.push(`${name}必须是数字`);
        } else if (type === 'integer' && !Number.isInteger(Number(value))) {
            invalidFields.push(`${name}必须是整数`);
        } else if (type === 'boolean' && typeof value !== 'boolean') {
            invalidFields.push(`${name}必须是布尔值`);
        } else if (type === 'date' && !isValidDate(value)) {
            invalidFields.push(`${name}格式不正确`);
        }

        // 检查长度限制
        if (maxLength && typeof value === 'string' && value.length > maxLength) {
            invalidFields.push(`${name}超过${maxLength}字符限制`);
        }
    });

    // 2. 执行特殊验证：估价师A和B姓名不能相同
    // 特殊验证：估价师A和B姓名不能相同
    if (reportData.appraiserA?.name && reportData.appraiserB?.name &&
        reportData.appraiserA.name === reportData.appraiserB.name) {
        invalidFields.push('估价师A和估价师B姓名不能相同');
    }

    return {
        isValid: missingFields.length === 0 && invalidFields.length === 0,
        missingFields,
        invalidFields
    };
};

// 辅助函数：验证日期格式
const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

module.exports = {
    validateReportData,
    isValidDate
};