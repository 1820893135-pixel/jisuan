import React, { useState, useMemo } from 'react';
import { worldHeritageData } from '../data/worldHeritageData';

const WorldHeritagePage: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<'all' | '文化遗产' | '文化与自然双遗产'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHeritage, setSelectedHeritage] = useState<any | null>(null);
  const pageSize = 12;

  const filteredData = useMemo(() => {
    let result = worldHeritageData;
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(kw) ||
        item.location.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [searchKeyword, filterType]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchKeyword('');
    setFilterType('all');
    setCurrentPage(1);
  };

  const getShortLocation = (location: string) => {
    if (location.includes('、')) return location.split('、')[0] + '等地';
    if (location.length > 20) return location.substring(0, 18) + '...';
    return location;
  };

  const getImageUrl = (item: any) => {
    return item.image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='16'%3E${item.name.substring(0, 4)}%3C/text%3E%3C/svg%3E`;
  };

  const openBaike = (name: string) => {
    const url = `https://baike.baidu.com/item/${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="heritage-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🏛️</span> 中国的世界文化遗产
        </h1>
        <p className="page-subtitle">中国世界文化遗产 · 名录精选</p>
      </div>

      <div className="search-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索文化遗产名称或地点..."
            value={searchKeyword}
            onChange={handleSearch}
          />
          {searchKeyword && <button className="clear-btn" onClick={clearSearch}>✕</button>}
        </div>
        <div className="filter-buttons">
          <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => { setFilterType('all'); setCurrentPage(1); }}>全部</button>
          <button className={`filter-btn ${filterType === '文化遗产' ? 'active' : ''}`}
            onClick={() => { setFilterType('文化遗产'); setCurrentPage(1); }}>文化遗产</button>
          <button className={`filter-btn ${filterType === '文化与自然双遗产' ? 'active' : ''}`}
            onClick={() => { setFilterType('文化与自然双遗产'); setCurrentPage(1); }}>文化与自然双遗产</button>
        </div>
      </div>

      {paginatedData.length > 0 ? (
        <>
          <div className="cards-grid">
            {paginatedData.map(item => (
              <div key={item.id} className="heritage-card" onClick={() => setSelectedHeritage(item)}>
                <div className="card-image">
                  <img src={getImageUrl(item)} alt={item.name} />
                  <span className="card-year">{item.year}年列入</span>
                  <span className={`card-type ${item.type === '文化与自然双遗产' ? 'type-mixed' : ''}`}>
                    {item.type}
                  </span>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{item.name}</h3>
                  <p className="card-intro">{item.intro}</p>
                  <div className="card-location">
                    <span className="location-icon">📍</span>
                    <span>{getShortLocation(item.location)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← 上一页</button>
              <span className="page-info">第 {currentPage} / {totalPages} 页</span>
              <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一页 →</button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🏛️</div>
          <p>没有找到匹配的文化遗产</p>
          <button className="reset-btn" onClick={resetFilters}>查看全部</button>
        </div>
      )}

      {selectedHeritage && (
        <div className="detail-modal" onClick={() => setSelectedHeritage(null)}>
          <div className="detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedHeritage(null)}>✕</button>
            <div className="detail-image">
              <img src={getImageUrl(selectedHeritage)} alt={selectedHeritage.name} />
            </div>
            <div className="detail-body">
              <h2 className="detail-title">{selectedHeritage.name}</h2>
              <div className="detail-meta">
                <div className="meta-item"><span className="meta-label">遗产类型</span><span className="meta-value">{selectedHeritage.type}</span></div>
                <div className="meta-item"><span className="meta-label">遗产分布</span><span className="meta-value">{selectedHeritage.location}</span></div>
                <div className="meta-item"><span className="meta-label">列入年份</span><span className="meta-value">{selectedHeritage.year}年</span></div>
              </div>
              <div className="detail-description">
                <h3>详细介绍</h3>
                <p>{selectedHeritage.description}</p>
              </div>
              <div className="detail-actions">
                <button 
                  className="baike-btn"
                  onClick={() => openBaike(selectedHeritage.name)}
                >
                  查看百度百科
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap');

        .heritage-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px 64px;  /* 修改：顶部内边距改为0，消除与导航栏的留白 */
          font-family: system-ui, 'Segoe UI', 'Noto Sans CJK SC', sans-serif;
        }

        /* 专业美观的头部样式 */
        .page-header {
          text-align: center;
          margin: 0 0 56px 0;    /* 修改：上边距为0，下边距保留 */
          padding: 32px 0 24px;
          background: radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0) 70%);
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          position: relative;
        }

        /* 中式底纹装饰 */
        .page-header::before {
          content: "⿅";
          font-family: 'Noto Serif SC', serif;
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 96px;
          color: rgba(212, 175, 55, 0.06);
          pointer-events: none;
          font-weight: 300;
        }

        .page-header::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 25%;
          width: 50%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #d4af37, #f5e7a3, #d4af37, transparent);
          border-radius: 2px;
        }

        .page-title {
          font-size: 48px;
          font-weight: 600;
          font-family: 'Noto Serif SC', 'Times New Roman', serif;
          color: #2c3e2f;
          margin-bottom: 16px;
          letter-spacing: 6px;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.05);
          display: inline-block;
          padding: 0 24px;
          background: linear-gradient(135deg, #2c3e2f 0%, #4a6b3c 100%);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .title-icon {
          margin-right: 16px;
          font-size: 52px;
          display: inline-block;
          vertical-align: middle;
          background: linear-gradient(135deg, #b8860b, #d4af37);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .page-subtitle {
          font-size: 18px;
          color: #5a6b4a;
          font-family: 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
          font-weight: 500;
          letter-spacing: 2px;
          background: rgba(212, 175, 55, 0.12);
          display: inline-block;
          padding: 8px 32px;
          border-radius: 60px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(212, 175, 55, 0.4);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        /* 其余样式保持不变 */
        .search-bar { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 32px; flex-wrap: wrap; }
        .search-box { flex: 1; position: relative; max-width: 360px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9aa9b9; font-size: 16px; }
        .search-box input { width: 100%; padding: 12px 16px 12px 42px; border: 1px solid #e1e8f0; border-radius: 40px; font-size: 14px; outline: none; transition: all 0.2s; }
        .search-box input:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
        .clear-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: #e1e8f0; border: none; width: 22px; height: 22px; border-radius: 50%; font-size: 12px; cursor: pointer; color: #6c7a89; }
        .filter-buttons { display: flex; gap: 8px; background: #f5f7fa; padding: 4px; border-radius: 40px; }
        .filter-btn { padding: 8px 20px; border: none; background: transparent; border-radius: 32px; font-size: 14px; font-weight: 500; cursor: pointer; color: #4a5a6e; transition: all 0.2s; }
        .filter-btn.active { background: #d4af37; color: white; }
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .heritage-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .heritage-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .card-image { position: relative; height: 200px; overflow: hidden; background: #f1f5f9; }
        .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .heritage-card:hover .card-image img { transform: scale(1.05); }
        .card-year { position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .card-type { position: absolute; top: 12px; right: 12px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; background: rgba(0,0,0,0.7); color: white; }
        .card-type.type-mixed { background: #d4af37; color: #1a2c3e; }
        .card-content { padding: 20px; }
        .card-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1a2c3e; }
        .card-intro { font-size: 14px; color: #6c7a89; line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-location { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #9aa9b9; }
        .location-icon { font-size: 12px; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; padding: 20px 0; }
        .page-btn { padding: 8px 20px; background: white; border: 1px solid #e1e8f0; border-radius: 32px; cursor: pointer; transition: all 0.2s; }
        .page-btn:hover:not(:disabled) { border-color: #d4af37; background: #fef9e6; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-info { font-size: 14px; color: #6c7a89; }
        .empty-state { text-align: center; padding: 60px 20px; background: #f8f9fc; border-radius: 24px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .reset-btn { padding: 10px 24px; background: #d4af37; border: none; border-radius: 32px; color: white; font-weight: 500; cursor: pointer; }
        .detail-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .detail-content { max-width: 900px; width: 100%; max-height: 90vh; background: white; border-radius: 24px; overflow-y: auto; position: relative; }
        .close-modal { position: absolute; top: 20px; right: 20px; width: 36px; height: 36px; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; color: white; font-size: 18px; cursor: pointer; z-index: 10; }
        .detail-image { height: 320px; overflow: hidden; background: #f1f5f9; }
        .detail-image img { width: 100%; height: 100%; object-fit: cover; }
        .detail-body { padding: 32px; }
        .detail-title { font-size: 28px; font-weight: 600; margin-bottom: 24px; color: #1a2c3e; }
        .detail-meta { background: #f5f7fa; border-radius: 16px; padding: 20px; margin-bottom: 28px; }
        .meta-item { display: flex; margin-bottom: 12px; }
        .meta-item:last-child { margin-bottom: 0; }
        .meta-label { width: 90px; font-weight: 600; color: #4a5a6e; }
        .meta-value { flex: 1; color: #1a2c3e; }
        .detail-description h3 { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1a2c3e; }
        .detail-description p { line-height: 1.8; color: #4a5a6e; text-align: justify; }
        .detail-actions { margin-top: 28px; text-align: center; }
        .baike-btn { padding: 8px 24px; background: #1890ff; color: white; border: none; border-radius: 32px; cursor: pointer; font-size: 14px; transition: background 0.2s; }
        .baike-btn:hover { background: #40a9ff; }

        @media (max-width: 768px) {
          .heritage-page { padding: 0 16px 32px; }
          .page-title { font-size: 28px; letter-spacing: 3px; }
          .title-icon { font-size: 36px; }
          .page-subtitle { font-size: 14px; padding: 6px 20px; }
          .search-bar { flex-direction: column; }
          .search-box { max-width: 100%; }
          .cards-grid { grid-template-columns: 1fr; }
          .detail-body { padding: 20px; }
          .detail-title { font-size: 22px; }
          .page-header::before { font-size: 64px; top: -5px; }
        }
      `}</style>
    </div>
  );
};

export default WorldHeritagePage;