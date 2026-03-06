//  src/routes/index.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Home from '../pages/home';
import ModuleSelect from '../pages/modules/Select';
import ModuleLayout from '../pages/modules/ModuleLayout';



import AccountingHomePage from '../pages/modules/accounting/AccountingHomePage';
import AccountingDetails from '../pages/modules/accounting/AccountingDetails';
import AccountingAdd from '../pages/modules/accounting/AccountingAdd';
import AccountingCharts from '../pages/modules/accounting/AccountingCharts';
import AccountingMy from '../pages/modules/accounting/AccountingMy';



import MusicHome from '../pages/modules/music/Home';
import MusicRecommend from '../pages/modules/music/Recommend';
import MusicRecent from '../pages/modules/music/Recent';
import MusicFavorites from '../pages/modules/music/Favorites';
import Musicplayer from '../pages/modules/music/Player';
import MusicplayerLyrics from '../pages/modules/music/MusicplayerLyrics';
import MusicPlaylist from '../pages/modules/music/MusicPlaylist';
import MusicSongReview from '../pages/modules/music/SongReview';
import MusicTogetherRoomManager from '../pages/modules/music/TogetherRoomManager';

import OutfitCloset from '../pages/modules/outfit/Closet';
import OutfitCombos from '../pages/modules/outfit/Combos';
import OutfitUpdateWardrobe from '../pages/modules/outfit/UpdateWardrobe';//更新衣柜
import OutfitPreviewWardrobe from '../pages/modules/outfit/PreviewWardrobe';//查看衣柜
import OfficeDashboard from '../pages/modules/office/Dashboard';
import OfficeDocs from '../pages/modules/office/Docs';
import OfficeTasks from '../pages/modules/office/Tasks';

import ChatChat from '../pages/modules/chat/Chat';
import ChatDressingGuidelines from '../pages/modules/chat/DressingGuidelines';

import SystemThemeSettings from '../pages/modules/system/SystemThemeSettings';
import SystemProfile from '../pages/modules/system/Profile';
import Login from '../pages/user/login';
import Register from '../pages/user/register';
import ProtectedRoute from './ProtectedRoute';
 

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* 公开路由 */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/apps" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/apps" replace /> : <Register />
        }
      />

      <Route
        path="/home"
        element={
          isAuthenticated ? <Home /> : <Navigate to="/login" replace />
        }
      />

      {/* 登录后选择模块的入口 */}
      <Route
        path="/apps"
        element={
          <ProtectedRoute>
            <ModuleSelect />
          </ProtectedRoute>
        }
      />

      {/* 各模块布局与子路由 */}
      <Route
        path="/app/accounting"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="accounting" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="AccountingCharts" replace />} />
        <Route path="AccountingCharts" element={<AccountingCharts />} />
        <Route path="AccountingHomePage" element={<AccountingHomePage />} />
        <Route path="AccountingDetails" element={<AccountingDetails />} />
        <Route path="AccountingAdd" element={<AccountingAdd />} />
        <Route path="AccountingMy" element={<AccountingMy />} />
      </Route>

      <Route
        path="/app/music"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="music" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<MusicHome />} />
        <Route path="recommend" element={<MusicRecommend />} />
        <Route path="recent" element={<MusicRecent />} />
        <Route path="favorites" element={<MusicFavorites />} />
        <Route path="musicplayerlyrics" element={<MusicplayerLyrics />} />
         <Route path="musicplayer" element={<Musicplayer />} />
         <Route path="musicplaylist" element={<MusicPlaylist />} />
         <Route path="musicsongreview" element={<MusicSongReview />} />
         <Route path="musictogetherroommanager" element={<MusicTogetherRoomManager />} />
      </Route>

      <Route
        path="/app/outfit"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="outfit" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="closet" replace />} />
        <Route path="closet" element={<OutfitCloset />} />
        <Route path="combos" element={<OutfitCombos />} />
        <Route path="updatewardrobe" element={<OutfitUpdateWardrobe />} />
        <Route path="previewwardrobe" element={<OutfitPreviewWardrobe />} />
      </Route>

      <Route
        path="/app/office"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="office" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OfficeDashboard />} />
        <Route path="docs" element={<OfficeDocs />} />
        <Route path="tasks" element={<OfficeTasks />} />
      </Route>

      <Route
        path="/app/chat"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="chat" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="ChatChat" replace />} />
        <Route path="ChatChat" element={<ChatChat />} />
        <Route path="ChatDressingGuidelines" element={<ChatDressingGuidelines />} />
      </Route>

      <Route
        path="/app/system"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="system" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="theme" replace />} />
        <Route path="theme" element={<SystemThemeSettings />} />
        <Route path="profile" element={<SystemProfile />} />
      </Route>


      {/* 404 页面 */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;