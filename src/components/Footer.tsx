function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <span className="footer-mark">SJ</span>
          <p className="copyright">© 2025 StyleJenich Fashion. All rights reserved.</p>
        </div>
      </div>
      <p className="footer-connect">Connect with us</p>
      <div className="social-links">
        <a
          href="https://www.facebook.com/share/1Anvcqb5aj/?mibextid=wwXIfr"
          target="_blank"
          rel="noreferrer"
          className="facebook"
          aria-label="Facebook"
        >
          <i className="fab fa-facebook"></i>
        </a>
        <a
          href="https://www.instagram.com/stylejenich1?igsh=eHFmMzE4YnVmeWU1&utm_source=ig_contact_invite"
          target="_blank"
          rel="noreferrer"
          className="instagram"
          aria-label="Instagram"
        >
          <i className="fab fa-instagram"></i>
        </a>
        <a
          href="https://pin.it/3KUDSE8kp"
          target="_blank"
          rel="noreferrer"
          className="pinterest"
          aria-label="Pinterest"
        >
          <i className="fab fa-pinterest"></i>
        </a>
      </div>
    </footer>
  );
}

export default Footer;
