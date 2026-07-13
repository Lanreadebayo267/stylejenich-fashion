import { useState } from 'react';
import type { ContactFormValues } from '../types';

const initialValues: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  message: '',
};

function ContactPage() {
  const [values, setValues] = useState<ContactFormValues>(initialValues);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, this would send the form data to a server or API.
    alert(`Thank you for your message, ${values.name}! We'll get back to you soon at ${values.email}.`);
    setValues(initialValues);
  };

  return (
    <section className="page active" id="contact">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">Book a Consultation</span>
          <h2>Get In Touch</h2>
          <p>Ready to begin your custom design journey? Contact us to schedule a consultation.</p>
        </div>

        <div className="contact-form">
          <form id="contactForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                className="form-control"
                value={values.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={values.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                className="form-control"
                value={values.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Tell Us About Your Project</label>
              <textarea
                id="message"
                className="form-control"
                value={values.message}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn">
              Send Message
            </button>
          </form>
        </div>

        <div
          className="contact-info"
          style={{ marginTop: 60, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}
        >
          <div className="info-item" style={{ textAlign: 'center', margin: 20 }}>
            <h3 style={{ marginBottom: 15, color: 'var(--accent)' }}>Studio Address</h3>
            <p>Bishop Oderinde Street Off AIT Road</p>
            <p>Alagbado</p>
            <p>Lagos, NG 100001</p>
          </div>
          <div className="info-item" style={{ textAlign: 'center', margin: 20 }}>
            <h3 style={{ marginBottom: 15, color: 'var(--accent)' }}>Contact Info</h3>
            <p>jennifer.adebayo@gmail.com</p>
            <p>(+234) 803 328 5046</p>
          </div>
          <div className="info-item" style={{ textAlign: 'center', margin: 20 }}>
            <h3 style={{ marginBottom: 15, color: 'var(--accent)' }}>Working Hours</h3>
            <p>Monday - Friday: 10am - 6pm</p>
            <p>Saturday: 11am - 4pm</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactPage;
