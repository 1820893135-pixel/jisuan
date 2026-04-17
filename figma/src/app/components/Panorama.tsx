import { useState } from "react";
import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import {
  ChevronLeft,
  Maximize2,
  Info,
  MapPin,
  Clock,
  Users,
  Camera,
  Move,
} from "lucide-react";

const panoramaSites = [
  {
    id: "great-wall",
    name: "长城",
    englishName: "The Great Wall",
    location: "北京",
    description: "世界七大奇迹之一，中国古代军事防御工程的杰作",
    image: "https://images.unsplash.com/photo-1555085634-265dff003dc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwaGVyaXRhZ2UlMjBncmVhdCUyMHdhbGx8ZW58MXx8fHwxNzc1OTIxNzk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    openTime: "06:30 - 19:30",
    visitors: "10万+",
    facts: [
      "总长度超过21,000公里",
      "建造时间跨越2000多年",
      "1987年被列入世界文化遗产",
    ],
  },
  {
    id: "forbidden-city",
    name: "故宫",
    englishName: "Forbidden City",
    location: "北京",
    description: "中国明清两代的皇家宫殿，世界上现存规模最大的宫殿型建筑",
    image: "https://images.unsplash.com/photo-1599353510826-7d21e0eb5365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JiaWRkZW4lMjBjaXR5JTIwYmVpamluZyUyMGNoaW5hfGVufDF8fHx8MTc3NTkyMTc5OHww&ixlib=rb-4.1.0&q=80&w=1080",
    openTime: "08:30 - 17:00",
    visitors: "8万+",
    facts: [
      "拥有9999间房屋",
      "占地面积72万平方米",
      "1987年被列入世界文化遗产",
    ],
  },
  {
    id: "terracotta",
    name: "兵马俑",
    englishName: "Terracotta Army",
    location: "西安",
    description: "秦始皇陵的陪葬坑，被誉为世界第八大奇迹",
    image: "https://images.unsplash.com/photo-1648726444582-6d108b5d13dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXJyYWNvdHRhJTIwd2FycmlvcnMlMjBjaGluYXxlbnwxfHx8fDE3NzU5MjE3OTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    openTime: "08:30 - 18:00",
    visitors: "6万+",
    facts: [
      "共有8000多个兵马俑",
      "每个俑的面貌都不相同",
      "1987年被列入世界文化遗产",
    ],
  },
];

export function Panorama() {
  const { siteId } = useParams();
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const currentSite = siteId
    ? panoramaSites.find((s) => s.id === siteId) || panoramaSites[0]
    : panoramaSites[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const delta = e.clientX - startX;
      setRotation((prev) => prev + delta * 0.5);
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const delta = e.touches[0].clientX - startX;
      setRotation((prev) => prev + delta * 0.5);
      setStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="size-full flex flex-col bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-white text-xl">{currentSite.name}</h1>
            <p className="text-white/70 text-sm">
              {currentSite.englishName}
            </p>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
              showInfo
                ? "bg-red-600"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Drag Hint */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isDragging ? 0 : 0.7 }}
          className="flex items-center justify-center gap-2 mt-4 text-white/70 text-sm"
        >
          <Move className="w-4 h-4" />
          <span>拖动查看360°全景</span>
        </motion.div>
      </div>

      {/* Panorama Viewer */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Simulated Panorama - Multiple Images */}
        <motion.div
          className="absolute inset-0 flex"
          style={{
            transform: `translateX(${rotation % 360}px)`,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <img
              key={i}
              src={currentSite.image}
              alt={currentSite.name}
              className="h-full w-auto object-cover flex-shrink-0"
              draggable={false}
            />
          ))}
        </motion.div>

        {/* Hotspots */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2"
        >
          <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-white" />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg whitespace-nowrap text-sm">
            观景台
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute top-1/3 right-1/3 -translate-x-1/2 -translate-y-1/2"
        >
          <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center hover:scale-110 transition-transform">
            <Info className="w-6 h-6 text-white" />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg whitespace-nowrap text-sm">
            历史介绍
          </div>
        </motion.div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[60vh] overflow-y-auto z-30"
        >
          <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-6" />

          <h2 className="text-2xl text-stone-900 mb-2">
            {currentSite.name}
          </h2>
          <p className="text-stone-600 mb-6">
            {currentSite.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
              <MapPin className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xs text-stone-500">地点</div>
                <div className="text-sm text-stone-900">
                  {currentSite.location}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
              <Clock className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xs text-stone-500">开放时间</div>
                <div className="text-sm text-stone-900">
                  {currentSite.openTime}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl col-span-2">
              <Users className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xs text-stone-500">日均游客</div>
                <div className="text-sm text-stone-900">
                  {currentSite.visitors}
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-lg text-stone-900 mb-4">
            景点亮点
          </h3>
          <ul className="space-y-3">
            {currentSite.facts.map((fact, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-stone-700"
              >
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/itinerary"
            className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-4 rounded-xl mt-6 transition-colors"
          >
            加入行程
          </Link>
        </motion.div>
      )}

      {/* Site Selector */}
      {!siteId && (
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {panoramaSites.map((site) => (
              <Link
                key={site.id}
                to={`/panorama/${site.id}`}
                className={`flex-shrink-0 w-24 ${
                  currentSite.id === site.id ? "ring-2 ring-white" : ""
                } rounded-xl overflow-hidden`}
              >
                <img
                  src={site.image}
                  alt={site.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="bg-white/90 backdrop-blur-sm p-2 text-center">
                  <div className="text-xs text-stone-900">{site.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
