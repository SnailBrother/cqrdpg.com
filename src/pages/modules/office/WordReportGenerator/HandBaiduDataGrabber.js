//手动百度信息采集
import React, { useState, useEffect } from 'react';
import './HandBaiduDataGrabber.css';

const DEFAULT_FORM = {
  location: "",
  bank: "",
  supermarket: "",
  hospital: "",
  school: "",
  nearbyCommunity: "",
  busStopName: "",
  busRoutes: "",
  areaRoad: "",
  boundaries: "",
  streetStatus: "",
  direction: "",
  orientation: "",
  distance: ""
};

const HandBaiduDataGrabber = ({ location, initialData = {}, onSave, onClose }) => {
  const [formData, setFormData] = useState({ 
    ...DEFAULT_FORM,
     ...initialData,
      location: location || '' });

  const [mapUrl] = useState('https://map.baidu.com/');

  // useEffect(() => {
  //   setFormData(prev => ({
  //     ...DEFAULT_FORM,
  //     ...initialData,
  //     location: location || ''
  //   }));
  // }, [location, initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const { location, ...dataToSave } = formData;
    onSave(dataToSave);
    onClose();
  };

  return (
    <div className="handmap-container handmap-modal">
      <div className="handmap-content">
        <div className="handmap-header">
          <h3>周边配套（手动版）：</h3>
          <button className="handmap-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="handmap-main">
          <div className="handmap-form-container">
            <div className="handmap-form">
              <div className="handmap-field">
                <label>坐落:</label>
                <input
                  type="text"
                  value={formData.location}
                  readOnly
                  className="handmap-location-input"
                />
              </div>

              <div className="handmap-field">
                <label>临街:</label>
                <textarea
                  value={formData.streetStatus}
                  onChange={(e) => handleChange('streetStatus', e.target.value)}
                  placeholder="请输入临街状况"
                />
              </div>
              <div className="handmap-field">
                <label>方位:</label>
                <textarea
                  value={formData.direction}
                  onChange={(e) => handleChange('direction', e.target.value)}
                  placeholder="请输入方位"
                />
              </div>
              <div className="handmap-field">
                <label>朝向:</label>
                <textarea
                  value={formData.orientation}
                  onChange={(e) => handleChange('orientation', e.target.value)}
                  placeholder="请输入朝向"
                />
              </div>
              <div className="handmap-field">
                <label>距离:</label>
                <textarea
                  value={formData.distance}
                  onChange={(e) => handleChange('distance', e.target.value)}
                  placeholder="请输入距离重要场所距离"
                />
              </div>           
              <div className="handmap-field">
                <label>四至:</label>
                <textarea
                  value={formData.boundaries}
                  onChange={(e) => handleChange('boundaries', e.target.value)}
                  placeholder="请输入四至信息（如：东至XX路，南至XX小区）"
                />
              </div>

              <div className="handmap-field">
                <label>银行:</label>
                <textarea
                  value={formData.bank}
                  className="handmap-field-textarea"
                  onChange={(e) => handleChange('bank', e.target.value)}
                  placeholder="请手动输入周边银行信息"
                />
              </div>

              <div className="handmap-field">
                <label>超市:</label>
                <textarea
                  value={formData.supermarket}
                  onChange={(e) => handleChange('supermarket', e.target.value)}
                  placeholder="请手动输入周边超市信息"
                />
              </div>

              <div className="handmap-field">
                <label>医院:</label>
                <textarea
                  value={formData.hospital}
                  onChange={(e) => handleChange('hospital', e.target.value)}
                  placeholder="请手动输入周边医院信息"
                />
              </div>

              <div className="handmap-field">
                <label>学校:</label>
                <textarea
                  value={formData.school}
                  onChange={(e) => handleChange('school', e.target.value)}
                  placeholder="请手动输入周边学校信息"
                />
              </div>

              <div className="handmap-field">
                <label>小区:</label>
                <textarea
                  value={formData.nearbyCommunity}
                  onChange={(e) => handleChange('nearbyCommunity', e.target.value)}
                  placeholder="请手动输入周边小区信息"
                />
              </div>

              <div className="handmap-field">
                <label>公交站:</label>
                <textarea
                  value={formData.busStopName}
                  onChange={(e) => handleChange('busStopName', e.target.value)}
                  placeholder="请手动输入公交站名"
                />
              </div>

              <div className="handmap-field">
                <label>公交线路:</label>
                <textarea
                  value={formData.busRoutes}
                  onChange={(e) => handleChange('busRoutes', e.target.value)}
                  placeholder="请手动输入公交线路，如102路、105路、309路"
                />
              </div>

              <div className="handmap-field">
                <label>道路:</label>
                <textarea
                  value={formData.areaRoad}
                  onChange={(e) => handleChange('areaRoad', e.target.value)}
                  placeholder="请手动输入周边道路信息"
                />
              </div>
            </div>

            <div className="handmap-actions">
              <button className="handmap-cancel" onClick={onClose}>
                取消
              </button>
              <button className="handmap-save" onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
          
          <div className="handmap-iframe-container">
            <div className="handmap-compass-overlay">
              <div className="handmap-compass-north">北</div>
              <div className="handmap-compass-east">东</div>
              <div className="handmap-compass-south">南</div>
              <div className="handmap-compass-west">西</div>
            </div>
            <iframe
              src={mapUrl}
              title="百度地图"
              className="handmap-iframe"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandBaiduDataGrabber;