import { Link } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, MapPin, Clock, Star, Calendar, Maximize2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const featuredSites = [
  {
    id: "great-wall",
    name: "长城",
    englishName: "The Great Wall",
    location: "北京",
    image: "https://images.unsplash.com/photo-1555085634-265dff003dc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwaGVyaXRhZ2UlMjBncmVhdCUyMHdhbGx8ZW58MXx8fHwxNzc1OTIxNzk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    visitors: "10万+",
  },
  {
    id: "forbidden-city",
    name: "故宫",
    englishName: "Forbidden City",
    location: "北京",
    image: "https://images.unsplash.com/photo-1599353510826-7d21e0eb5365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JiaWRkZW4lMjBjaXR5JTIwYmVpamluZyUyMGNoaW5hfGVufDF8fHx8MTc3NTkyMTc5OHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.8,
    visitors: "8万+",
  },
  {
    id: "terracotta",
    name: "兵马俑",
    englishName: "Terracotta Army",
    location: "西安",
    image: "https://images.unsplash.com/photo-1648726444582-6d108b5d13dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXJyYWNvdHRhJTIwd2FycmlvcnMlMjBjaGluYXxlbnwxfHx8fDE3NzU5MjE3OTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    visitors: "6万+",
  },
];

export function Home() {
  return (
    <div className="size-full overflow-y-auto pb-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[70vh] min-h-[500px] overflow-hidden"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1761160781452-77b984fe94e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjaGluZXNlJTIwaGVyaXRhZ2UlMjBncmVhdCUyMHdhbGx8ZW58MXx8fHwxNzc1OTIxNzk3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="长城"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        <div className="relative h-full flex flex-col justify-end px-6 pb-12 max-w-screen-xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-white text-5xl md:text-7xl mb-4">
              中国文化遗产
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mb-8">
              探索五千年文明，感受古老建筑的魅力
            </p>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full transition-colors"
            >
              开始探索
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Sites */}
      <section className="px-6 py-12 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl text-stone-900">热门景点</h2>
          <Link
            to="/map"
            className="text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredSites.map((site, index) => (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <Link
                to={`/panorama/${site.id}`}
                className="block group"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-4">
                  <img
                    src={site.image}
                    alt={site.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{site.rating}</span>
                  </div>
                </div>

                <h3 className="text-xl text-stone-900 mb-2">
                  {site.name}
                </h3>
                <p className="text-stone-600 text-sm mb-3">
                  {site.englishName}
                </p>

                <div className="flex items-center justify-between text-sm text-stone-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{site.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{site.visitors}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-6 py-12 bg-stone-100">
        <div className="max-w-screen-xl mx-auto">
          <h2 className="text-3xl text-stone-900 mb-8">快速入口</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/map"
              className="bg-white p-8 rounded-2xl hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl text-stone-900 mb-2">
                景点地图
              </h3>
              <p className="text-stone-600">
                查看所有文化遗产的地理位置
              </p>
            </Link>

            <Link
              to="/itinerary"
              className="bg-white p-8 rounded-2xl hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl text-stone-900 mb-2">
                行程规划
              </h3>
              <p className="text-stone-600">
                定制您的文化遗产探索之旅
              </p>
            </Link>

            <Link
              to="/panorama"
              className="bg-white p-8 rounded-2xl hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Maximize2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl text-stone-900 mb-2">
                全景浏览
              </h3>
              <p className="text-stone-600">
                沉浸式体验中国文化遗产
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
