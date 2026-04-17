import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { MapPin, Search, Filter, Navigation, Star } from "lucide-react";

const heritageSites = [
  {
    id: "great-wall",
    name: "长城",
    englishName: "The Great Wall",
    location: "北京",
    coordinates: { x: 72, y: 28 },
    category: "建筑",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1555085634-265dff003dc5?w=400",
  },
  {
    id: "forbidden-city",
    name: "故宫",
    englishName: "Forbidden City",
    location: "北京",
    coordinates: { x: 71, y: 29 },
    category: "建筑",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1599353510826-7d21e0eb5365?w=400",
  },
  {
    id: "terracotta",
    name: "兵马俑",
    englishName: "Terracotta Army",
    location: "西安",
    coordinates: { x: 62, y: 38 },
    category: "遗址",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1648726444582-6d108b5d13dc?w=400",
  },
  {
    id: "summer-palace",
    name: "颐和园",
    englishName: "Summer Palace",
    location: "北京",
    coordinates: { x: 70, y: 27 },
    category: "园林",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1610712836144-e855545f6bef?w=400",
  },
  {
    id: "temple-heaven",
    name: "天坛",
    englishName: "Temple of Heaven",
    location: "北京",
    coordinates: { x: 73, y: 30 },
    category: "建筑",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1674637966612-6c05d18e7bab?w=400",
  },
];

const categories = ["全部", "建筑", "遗址", "园林"];

export function Map() {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");

  const filteredSites = heritageSites.filter((site) => {
    const matchesSearch =
      site.name.includes(searchQuery) ||
      site.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.location.includes(searchQuery);
    const matchesCategory =
      selectedCategory === "全部" || site.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selected = selectedSite
    ? heritageSites.find((s) => s.id === selectedSite)
    : null;

  return (
    <div className="size-full flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-6 py-4">
        <h1 className="text-2xl text-stone-900 mb-4">景点地图</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="搜索景点名称或地点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-red-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-stone-100 overflow-hidden">
        {/* Simplified China Map Background */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full max-w-4xl aspect-[4/3] bg-gradient-to-br from-stone-200 to-stone-100 rounded-3xl shadow-inner">
            {/* Map Grid */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0 border-t border-stone-400"
                  style={{ top: `${i * 5}%` }}
                />
              ))}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute top-0 bottom-0 border-l border-stone-400"
                  style={{ left: `${i * 5}%` }}
                />
              ))}
            </div>

            {/* Heritage Site Markers */}
            {filteredSites.map((site, index) => (
              <motion.button
                key={site.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedSite(site.id)}
                className="absolute group"
                style={{
                  left: `${site.coordinates.x}%`,
                  top: `${site.coordinates.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`relative ${
                    selectedSite === site.id ? "z-10" : "z-0"
                  }`}
                >
                  {/* Pulse Animation */}
                  {selectedSite === site.id && (
                    <motion.div
                      className="absolute inset-0 bg-red-500 rounded-full"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}

                  {/* Marker */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      selectedSite === site.id
                        ? "bg-red-600 scale-125"
                        : "bg-white group-hover:bg-red-500 group-hover:scale-110"
                    }`}
                  >
                    <MapPin
                      className={`w-5 h-5 ${
                        selectedSite === site.id
                          ? "text-white"
                          : "text-red-600 group-hover:text-white"
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                      selectedSite === site.id
                        ? "bg-red-600 text-white scale-100 opacity-100"
                        : "bg-white text-stone-900 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                    }`}
                  >
                    <div className="text-sm">{site.name}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected Site Card */}
        {selected && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => setSelectedSite(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"
            >
              ×
            </button>

            <div className="aspect-video relative overflow-hidden">
              <img
                src={selected.image}
                alt={selected.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl text-stone-900">
                    {selected.name}
                  </h3>
                  <p className="text-sm text-stone-600">
                    {selected.englishName}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{selected.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{selected.location}</span>
                <span className="px-2 py-0.5 bg-stone-100 rounded text-xs">
                  {selected.category}
                </span>
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/panorama/${selected.id}`}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-xl transition-colors"
                >
                  查看全景
                </Link>
                <Link
                  to="/itinerary"
                  className="px-6 bg-stone-100 hover:bg-stone-200 text-stone-900 flex items-center justify-center rounded-xl transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
