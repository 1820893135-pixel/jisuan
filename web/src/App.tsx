import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { TravelAppProvider } from './context/TravelAppContext'
import { ExplorePage } from './pages/ExplorePage'
import { HomePage } from './pages/HomePage'
import { PanoramaPage } from './pages/PanoramaPage'
import { PlannerPage } from './pages/PlannerPage'
import { ProfilePage } from './pages/ProfilePage'
import WorldHeritagePage from './pages/WorldHeritagePage'
import AboutUsPage from './pages/AboutUsPage'        // 新增导入
import './App.css'

function App() {
  return (
    <TravelAppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/map" element={<ExplorePage />} />
            <Route path="/itinerary" element={<PlannerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/panorama" element={<PanoramaPage />} />
            <Route path="/panorama/:poiId" element={<PanoramaPage />} />
            <Route path="/heritage" element={<WorldHeritagePage />} />
            <Route path="/about" element={<AboutUsPage />} />          {/* 新增路由 */}
            <Route path="/explore" element={<Navigate replace to="/map?scope=national" />} />
            <Route path="/planner" element={<Navigate replace to="/itinerary" />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TravelAppProvider>
  )
}

export default App