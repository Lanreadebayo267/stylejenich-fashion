import type { PageId } from '../types';
import { collections } from '../data/content';
import StitchDivider from './StitchDivider';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

function HomePage({ onNavigate }: HomePageProps) {
  return (
    <section className="page home-page active">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <span className="eyebrow">Atelier &mdash; Lagos, Nigeria</span>
              <h1>
                Handcrafted <em>Elegance</em>, Tailored Just For You
              </h1>
              <p>
                Experience the artistry and passion behind every stitch. Custom designs that
                celebrate your unique style and personality. Where fashion meets craftsmanship.
              </p>
              <button className="btn" onClick={() => onNavigate('gallery')}>
                View Collections
              </button>
            </div>
            <div className="hero-image">
              <div className="hero-image-frame">
                <img src="images/StyleJenich-logo.jpg" alt="Artist behind the scenes" />
                <div className="hero-tag">
                  Est. Lagos
                  <span>Made to measure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StitchDivider variant="dark" />

      <section className="collections">
        <div className="container">
          <div className="section-title">
            <span className="eyebrow">The Lookbook</span>
            <h2>Featured Collections</h2>
            <p>
              Explore our latest creations showcasing the perfect blend of tradition and
              contemporary design.
            </p>
          </div>
          <div className="collection-grid">
            {collections.map((item, index) => (
              <div className="collection-item" key={item.id}>
                <div className="collection-img">
                  <span className="collection-number">
                    Look {String(index + 1).padStart(2, '0')}
                  </span>
                  <img src={item.image} alt={item.alt} />
                </div>
                <div className="collection-info">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StitchDivider variant="light" />

      <section className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-image">
              <img
                src="images/Artisan.jpg"
                alt="Fashion designer working at a sewing machine in a bright studio filled with fabric rolls and sketches"
              />
            </div>
            <div className="about-text">
              <span className="eyebrow">The Artisan</span>
              <h2>The Hands Behind the Designs</h2>
              <p>
                With over 10 years of experience in the fashion industry, our designer combines
                traditional techniques with contemporary aesthetics to create garments that tell
                a story.
              </p>
              <p>
                Each piece is carefully conceptualized, from the initial sketch to the final
                stitch, ensuring impeccable quality and attention to detail that sets our
                creations apart.
              </p>
              <button className="btn btn--ghost" onClick={() => onNavigate('about')}>
                Read More
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default HomePage;
