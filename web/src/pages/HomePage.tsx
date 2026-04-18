import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomeHeroSlides, getPoiMedia } from '../content/heritageMedia'
import { useTravelApp } from '../context/useTravelApp'

export function HomePage() {
  const { guide } = useTravelApp()
  const heroSlides = getHomeHeroSlides()
  const featuredPois = guide?.pois.slice(0, 3) ?? []
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (heroSlides.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  function goToSlide(index: number) {
    setActiveSlide(index)
  }

  function showPreviousSlide() {
    setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)
  }

  function showNextSlide() {
    setActiveSlide((current) => (current + 1) % heroSlides.length)
  }

  return (
    <div className="screen-page home-page">
      <section className="hero-section hero-section--carousel">
        <div
          className="hero-carousel__track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {heroSlides.map((slide) => (
            <article key={slide.id} className="hero-carousel__slide">
              <div className="hero-section__image">
                <img alt={slide.alt} src={slide.src} />
                <div className="hero-section__overlay" />
                <div className="hero-section__fade" />
              </div>

              <div className="hero-section__content">
                <div className="hero-section__copy">
                  <span className="hero-section__eyebrow">{slide.kicker}</span>
                  <h1>中国文化遗产</h1>
                  <p>{slide.summary}</p>

                  <div className="hero-section__actions">
                    <Link className="button-primary" to="/map?scope=national">
                      开始探索
                      <ChevronRight className="icon-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="hero-section__controls">
          <button
            aria-label="上一张"
            className="hero-section__control round-button"
            onClick={showPreviousSlide}
            type="button"
          >
            <ChevronLeft className="icon-5" />
          </button>

          <div className="hero-section__dots">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                aria-label={`切换到${slide.title}`}
                className={
                  index === activeSlide
                    ? 'hero-section__dot hero-section__dot--active'
                    : 'hero-section__dot'
                }
                onClick={() => goToSlide(index)}
                type="button"
              />
            ))}
          </div>

          <button
            aria-label="下一张"
            className="hero-section__control round-button"
            onClick={showNextSlide}
            type="button"
          >
            <ChevronRight className="icon-5" />
          </button>
        </div>
      </section>

      <section className="content-section home-hotspots">
        <div className="section-header">
          <h2>热门景点</h2>
          <Link className="text-link" to="/map?scope=national">
            查看全部
            <ChevronRight className="icon-4" />
          </Link>
        </div>

        <div className="card-grid">
          {featuredPois.map((poi, index) => {
            const media = getPoiMedia(poi.id, index, poi.imageSrc, poi.name)
            const target = guide
              ? `/map?city=${encodeURIComponent(guide.city)}&poi=${encodeURIComponent(poi.id)}&view=immersive`
              : '/map?scope=national'

            return (
              <Link key={poi.id} className="heritage-card" to={target}>
                <div className="heritage-card__media">
                  <img alt={media.alt} src={media.src} />
                  <div className="rating-pill">
                    <Star className="icon-4 rating-pill__icon" />
                    <span>{(4.7 + index * 0.1).toFixed(1)}</span>
                  </div>
                </div>

                <div className="heritage-card__body">
                  <h3>{poi.name}</h3>
                  <p>{poi.type}</p>
                  <div className="heritage-card__meta">
                    <span>
                      <MapPin className="icon-4" />
                      {guide?.city ?? '全国导览'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
