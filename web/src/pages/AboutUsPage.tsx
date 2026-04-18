import React from 'react';

const AboutUsPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">🏛️</span> 让每一处文明，都触手可及
          </h1>
          <p className="hero-subtitle">游迹 · 用科技唤醒沉睡的历史</p>
        </div>
      </div>

      <div className="about-container">
        <section className="story-section">
          <h2>我们的故事</h2>
          <div className="story-text">
            <p>
              我们是一群热爱历史、痴迷旅行的年轻人。每一次站在长城之上，每一次仰望莫高窟的壁画，我们都深感震撼——但同时也看到，太多珍贵的文化遗产，藏在深闺人未识，太多人因为没有合适的工具而错过了与历史的对话。
            </p>
            <p>
              于是，<strong>“游迹”</strong>诞生了。我们相信，科技不应冰冷，而应成为连接人与文明的桥梁。我们打造了<span className="highlight">真实地图 · AI行程规划 · 文化遗产导览</span>三位一体的平台，希望让你无论身在何处，都能轻松走近那些伟大的文明。
            </p>
          </div>
        </section>

        <section className="values-section">
          <h2>我们坚持</h2>
          <div className="values-grid">
            <div className="value-card">
              {/* 地图图标 SVG */}
              <svg className="value-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <h3>真实·沉浸</h3>
              <p>每一处点位、每一条路线都基于真实地理数据，搭配720°全景，让你身临其境。</p>
            </div>
            <div className="value-card">
              {/* 智能/机器人图标 SVG */}
              <svg className="value-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="16" r="1" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <line x1="9" y1="19" x2="9" y2="21" />
                <line x1="15" y1="19" x2="15" y2="21" />
              </svg>
              <h3>智能·贴心</h3>
              <p>AI行程规划像老朋友一样记住你的偏好，定制专属于你的文化之旅。</p>
            </div>
            <div className="value-card">
              {/* 卷轴/文档图标 SVG */}
              <svg className="value-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <h3>传承·敬畏</h3>
              <p>我们不仅展示遗产，更讲述背后的故事，让每一次点击都是一次文明的致敬。</p>
            </div>
          </div>
        </section>

        <section className="mission-section">
          <div className="mission-quote">
            <p>“ 让文化遗产不再是课本里的符号，而是你脚下的路、眼中的光。”</p>
            <span>—— 游迹团队</span>
          </div>
          <div className="mission-background">
            <p>我们希望通过这个平台，让更多人了解中国世界文化遗产，并用AI的力量让旅行更有深度。</p>
          </div>
        </section>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap');

        .about-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 64px;
          font-family: 'Noto Serif SC', 'Times New Roman', serif;
        }

        .about-hero {
          text-align: center;
          padding: 60px 20px 40px;
          background: radial-gradient(circle at 50% 30%, rgba(212,175,55,0.1) 0%, rgba(255,255,255,0) 70%);
          border-bottom: 1px solid rgba(212,175,55,0.3);
          margin-bottom: 48px;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 600;
          color: #2c3e2f;
          letter-spacing: 2px;
          margin-bottom: 16px;
        }

        .hero-icon {
          font-size: 56px;
          display: inline-block;
          margin-right: 12px;
          background: linear-gradient(135deg, #b8860b, #d4af37);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #5a6b4a;
          border-top: 1px solid #e2dccd;
          display: inline-block;
          padding-top: 16px;
        }

        .about-container h2 {
          font-size: 32px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 32px;
          position: relative;
          display: inline-block;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #2c3e2f, #4a6b3c);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          letter-spacing: 2px;
        }
        .about-container h2::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 20%;
          width: 60%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #d4af37, #f5e7a3, #d4af37, transparent);
        }

        .story-section, .values-section, .mission-section {
          margin-bottom: 80px;
        }

        .story-text {
          max-width: 800px;
          margin: 0 auto;
          font-size: 18px;
          line-height: 1.8;
          color: #3a4a3a;
          text-align: justify;
        }
        .story-text p {
          margin-bottom: 20px;
        }
        .highlight {
          background: rgba(212,175,55,0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 500;
          color: #8a6e2e;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          margin-top: 24px;
        }
        .value-card {
          background: white;
          border-radius: 24px;
          padding: 32px 24px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid #f0ebdd;
        }
        .value-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.1);
          border-color: #d4af37;
        }
        .value-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 20px;
          color: #b8860b;
          transition: color 0.2s;
        }
        .value-card:hover .value-icon {
          color: #d4af37;
        }
        .value-card h3 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #2c3e2f;
        }
        .value-card p {
          font-size: 15px;
          line-height: 1.6;
          color: #5a6e5a;
        }

        .mission-quote {
          background: #fef8e7;
          padding: 40px 32px;
          border-radius: 48px;
          text-align: center;
          margin-bottom: 32px;
          border-left: 6px solid #d4af37;
          border-right: 6px solid #d4af37;
        }
        .mission-quote p {
          font-size: 26px;
          font-weight: 500;
          color: #2c3e2f;
          font-style: italic;
          margin-bottom: 16px;
        }
        .mission-quote span {
          font-size: 16px;
          color: #8a7a5a;
          letter-spacing: 1px;
        }
        .mission-background {
          text-align: center;
          font-size: 14px;
          color: #8a9a8a;
          border-top: 1px solid #e2dccd;
          padding-top: 24px;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 32px; }
          .hero-icon { font-size: 40px; }
          .hero-subtitle { font-size: 16px; }
          .story-text { font-size: 16px; }
          .mission-quote p { font-size: 20px; }
          .values-grid { grid-template-columns: 1fr; }
          .value-icon { width: 40px; height: 40px; }
        }
      `}</style>
    </div>
  );
};

export default AboutUsPage;