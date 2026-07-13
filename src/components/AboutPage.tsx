import StitchDivider from './StitchDivider';

const PROCESS_STEPS = [
  {
    title: 'Consultation',
    body: 'We discuss your vision, lifestyle needs, and personal style before a single stitch is planned.',
  },
  {
    title: 'Sketch & Fabric',
    body: 'Custom sketches are drawn and fabrics are selected together, so every choice is yours.',
  },
  {
    title: 'Construction & Fittings',
    body: 'Each garment goes through multiple fittings to get the fit and silhouette exactly right.',
  },
  {
    title: 'Final Reveal',
    body: 'A one-of-a-kind piece that reflects your personality and fits you perfectly, ready to wear.',
  },
];

function AboutPage() {
  return (
    <section className="page active" id="about">
      <div className="container">
        <div className="about-vision">
          <div className="about-image">
            <img
              src="images/mummy-yellow-with-cheetah2.jpg"
              alt="Portrait of the fashion designer standing in her studio surrounded by fabrics and fashion sketches"
            />
          </div>
          <div className="about-text">
            <span className="eyebrow">Our Vision</span>
            <h2>Fashion As Unique As You Are</h2>
            <p>
              Founded on the principles of quality craftsmanship and personalized design,
              StyleJenich was born from a passion for creating garments that make women feel
              confident and beautiful.
            </p>
            <blockquote className="pull-quote">
              &ldquo;Every piece we create is made with meticulous attention to detail, using
              only the finest fabrics and materials.&rdquo;
            </blockquote>

            <h3>The Process</h3>
            <ul className="process-list">
              {PROCESS_STEPS.map((step, index) => (
                <li className="process-step" key={step.title}>
                  <span className="process-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <StitchDivider variant="light" />

      <div className="container" style={{ marginTop: 70 }}>
        <div className="section-title">
          <span className="eyebrow">Behind the Seams</span>
          <h2>Our Studio</h2>
        </div>
        <div className="studio-grid">
          <div className="studio-item">
            <img
              src="images/mummy-pink-dress-on-mannequin2.jpg"
              alt="Design studio workspace showing fabric swatches, sketches, and sewing tools organized neatly"
            />
          </div>
          <div className="studio-item">
            <img
              src="images/mummy-pink-dress-on-mannequin.jpg"
              alt="Wall of colorful fabric rolls organized by color and material type in the studio"
            />
          </div>
          <div className="studio-item">
            <img
              src="images/Artisan.jpg"
              alt="Detail shot of sewing machine with fabric being stitched with precision"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
