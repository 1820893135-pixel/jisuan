import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, MapPin, Clock, Calendar as CalendarIcon, Check } from "lucide-react";

const availableSites = [
  {
    id: "great-wall",
    name: "长城",
    location: "北京",
    duration: "4小时",
    image: "https://images.unsplash.com/photo-1555085634-265dff003dc5?w=400",
  },
  {
    id: "forbidden-city",
    name: "故宫",
    location: "北京",
    duration: "3小时",
    image: "https://images.unsplash.com/photo-1599353510826-7d21e0eb5365?w=400",
  },
  {
    id: "terracotta",
    name: "兵马俑",
    location: "西安",
    duration: "3小时",
    image: "https://images.unsplash.com/photo-1648726444582-6d108b5d13dc?w=400",
  },
  {
    id: "summer-palace",
    name: "颐和园",
    location: "北京",
    duration: "3小时",
    image: "https://images.unsplash.com/photo-1610712836144-e855545f6bef?w=400",
  },
  {
    id: "temple-heaven",
    name: "天坛",
    location: "北京",
    duration: "2小时",
    image: "https://images.unsplash.com/photo-1674637966612-6c05d18e7bab?w=400",
  },
];

interface ItineraryItem {
  id: string;
  siteId: string;
  day: number;
  order: number;
}

export function Itinerary() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [numDays, setNumDays] = useState(3);

  const addToItinerary = (siteId: string) => {
    const newItem: ItineraryItem = {
      id: `${Date.now()}-${siteId}`,
      siteId,
      day: selectedDay,
      order: itinerary.filter((item) => item.day === selectedDay).length,
    };
    setItinerary([...itinerary, newItem]);
  };

  const removeFromItinerary = (itemId: string) => {
    setItinerary(itinerary.filter((item) => item.id !== itemId));
  };

  const getItemsForDay = (day: number) => {
    return itinerary
      .filter((item) => item.day === day)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        ...item,
        site: availableSites.find((s) => s.id === item.siteId)!,
      }));
  };

  const getTotalDuration = (day: number) => {
    const items = getItemsForDay(day);
    return items.length * 3;
  };

  const isInItinerary = (siteId: string) => {
    return itinerary.some(
      (item) => item.siteId === siteId && item.day === selectedDay
    );
  };

  return (
    <div className="size-full overflow-y-auto pb-20 bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-6 py-6">
        <h1 className="text-2xl text-stone-900 mb-4">行程规划</h1>

        {/* Days Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: numDays }).map((_, index) => {
            const day = index + 1;
            const dayItems = getItemsForDay(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 px-6 py-3 rounded-xl transition-all ${
                  selectedDay === day
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <div className="text-sm opacity-90">第{day}天</div>
                <div className="text-xs opacity-75 mt-1">
                  {dayItems.length} 个景点
                </div>
              </button>
            );
          })}
          {numDays < 7 && (
            <button
              onClick={() => setNumDays(numDays + 1)}
              className="flex-shrink-0 w-14 h-14 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5 text-stone-600" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Current Day Itinerary */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-stone-900">
              第{selectedDay}天行程
            </h2>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Clock className="w-4 h-4" />
              <span>预计 {getTotalDuration(selectedDay)} 小时</span>
            </div>
          </div>

          {getItemsForDay(selectedDay).length > 0 ? (
            <div className="space-y-4">
              {getItemsForDay(selectedDay).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600">{index + 1}</span>
                  </div>

                  <div className="aspect-video w-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.site.image}
                      alt={item.site.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg text-stone-900 mb-1">
                      {item.site.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{item.site.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.site.duration}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromItinerary(item.id)}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">
                还没有添加景点，从下方选择景点加入行程
              </p>
            </div>
          )}
        </div>

        {/* Available Sites */}
        <div>
          <h2 className="text-xl text-stone-900 mb-6">
            可选景点
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSites.map((site) => {
              const added = isInItinerary(site.id);
              return (
                <motion.div
                  key={site.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm"
                >
                  <div className="aspect-square w-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={site.image}
                      alt={site.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg text-stone-900 mb-1">
                      {site.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{site.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{site.duration}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => addToItinerary(site.id)}
                    disabled={added}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      added
                        ? "bg-green-100 text-green-600"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {added ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
