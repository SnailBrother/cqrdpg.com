import React, { useState, useEffect, useContext } from "react";
import "./equipment.css"; // 引入样式文件
import axios from "axios";
import { useAuth } from '../../../../context/AuthContext';

function Equipment() {
  // 从上下文中获取用户名
  const { user } = useAuth();
           const username = user?.username; // 从 user 对象中获取 username

  // 定义状态变量
  const [searchTerm, setSearchTerm] = useState("");  // 存储搜索关键字
  const [equipmentData, setEquipmentData] = useState([]); // 存储所有设备数据
  const [filteredEquipment, setFilteredEquipment] = useState([]); // 存储过滤后的设备数据
  const [modalVisible, setModalVisible] = useState(false); // 控制模态框的显示
  const [selectedEquipment, setSelectedEquipment] = useState(null); // 存储选中的设备数据
  const [newEquipment, setNewEquipment] = useState({ name: '', model: '', manufacturer: '', unit: '', price: '' }); // 新设备的数据

  // 获取设备数据的异步函数
  const fetchEquipmentData = async () => {
    try {
      // 发送 GET 请求获取设备数据
      const response = await axios.get("http://121.4.22.55:5202/api/getMachineryEquipmentPricesTable");
      setEquipmentData(response.data); // 更新所有设备数据
      setFilteredEquipment(response.data); // 更新过滤后的设备数据
    } catch (error) {
      console.error("获取设备数据失败:", error); // 捕获并打印错误
    }
  };

  // 使用 useEffect 在组件挂载时获取设备数据
  useEffect(() => {
    fetchEquipmentData(); // 调用获取设备数据的函数
  }, []);

  // 处理搜索输入变化的函数
  const handleSearchChange = (e) => {
    const value = e.target.value; // 获取输入框的值
    setSearchTerm(value); // 更新搜索关键字
    filterEquipment(value); // 根据搜索关键字过滤设备
  };

  // 根据搜索关键字过滤设备数据的函数
  const filterEquipment = (term) => {
    if (!term) {
      setFilteredEquipment(equipmentData); // 如果没有搜索关键字，显示所有设备
    } else {
      // 过滤设备数据
      const filtered = equipmentData.filter((equipment) =>
        equipment.name.toLowerCase().includes(term.toLowerCase()) ||
        equipment.model.toLowerCase().includes(term.toLowerCase()) ||
        equipment.manufacturer.toLowerCase().includes(term.toLowerCase()) ||
        equipment.unit.toLowerCase().includes(term.toLowerCase()) ||
        String(equipment.price).toLowerCase().includes(term.toLowerCase()) // 将价格转换为字符串并过滤
      );
      setFilteredEquipment(filtered); // 更新过滤后的设备数据
    }
  };

  // 显示模态框的函数
  const openModal = (equipment = null) => {
    setSelectedEquipment(equipment); // 设置选中的设备
    if (equipment) {
      setNewEquipment(equipment); // 如果是编辑，填充设备数据
    } else {
      // 添加新设备时，重置输入框
      setNewEquipment({ name: '', model: '', manufacturer: '', unit: '', price: '' });
    }
    setModalVisible(true); // 显示模态框
  };

  // 关闭模态框的函数
  const closeModal = () => {
    setModalVisible(false); // 隐藏模态框
    setSelectedEquipment(null); // 清空选中的设备
  };

  // 处理添加或更新设备的函数
  const handleSubmit = async (e) => {
    e.preventDefault(); // 防止默认表单提交行为
    try {
      if (selectedEquipment) {
        // 更新设备
        await axios.put(`http://121.4.22.55:5202/api/updateMachineryEquipmentPricesTable/${selectedEquipment.id}`, newEquipment);
      } else {
        // 添加新设备
        await axios.post("http://121.4.22.55:5202/api/addMachineryEquipmentPricesTable", newEquipment);
      }
      fetchEquipmentData(); // 刷新设备列表
      closeModal(); // 关闭模态框
    } catch (error) {
      console.error("操作失败:", error); // 捕获并打印错误
    }
  };

  // 删除设备的函数
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://121.4.22.55:5202/api/deleteMachineryEquipmentPricesTable/${id}`);
      fetchEquipmentData(); // 刷新设备列表
    } catch (error) {
      console.error("删除失败:", error); // 捕获并打印错误
    }
  };

  return (
    <div className="equipment-container">
      <header className="equipment-header">
        <h1>机器设备管理</h1>
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="搜索设备（名称、型号、厂家等）"
            className="search-input"
          />
          {username === "李中敬" && (
            <button className="add-button" onClick={() => openModal()}>添加设备</button>
          )}
        </div>
      </header>

      <section className="equipment-list">
        {filteredEquipment.length === 0 ? (
          <p className="no-results">没有找到相关设备。</p>
        ) : (
          <table className="equipment-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>型号</th>
                <th>厂家</th>
                <th>单位</th>
                <th>价格</th>
                {/* 这里不再显示操作列 */}
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((equipment) => (
                <tr key={equipment.id} onClick={() => openModal(equipment)}> {/* 点击行时打开模态框 */}
                  <td>{equipment.name}</td>
                  <td>{equipment.model}</td>
                  <td>{equipment.manufacturer}</td>
                  <td>{equipment.unit}</td>
                  <td>{equipment.price}元</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 模态框 */}
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedEquipment ? "编辑设备" : "添加设备"}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                名称:
                <input type="text" value={newEquipment.name} onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })} required />
              </label>
              <label>
                型号:
                <input type="text" value={newEquipment.model} onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })} required />
              </label>
              <label>
                厂家:
                <input type="text" value={newEquipment.manufacturer} onChange={(e) => setNewEquipment({ ...newEquipment, manufacturer: e.target.value })} required />
              </label>
              <label>
                单位:
                <input type="text" value={newEquipment.unit} onChange={(e) => setNewEquipment({ ...newEquipment, unit: e.target.value })} required />
              </label>
              <label>
                价格:
                <input type="number" value={newEquipment.price} onChange={(e) => setNewEquipment({ ...newEquipment, price: e.target.value })} required />
              </label>
              <div className="modal-buttons">
                <button type="submit">{selectedEquipment ? "更新设备" : "添加设备"}</button>
                <button type="button" onClick={closeModal}>关闭</button>
                {selectedEquipment && <button type="button" onClick={() => handleDelete(selectedEquipment.id)}>删除设备</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipment;
