import React from 'react';
import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';

function ContactPage({ navigateTo }) {
  return (
    <div className="cp-page">
      <div className="cp-hero">
        <button className="nd-back-btn cp-back" onClick={() => navigateTo('home')}>
          <ArrowLeft size={18} /> Back to Home
        </button>
        <h1 className="cp-title">Contact Us</h1>
        <p className="cp-subtitle">
          We are dedicated to answering your inquiries and guiding you toward the ideal dermatological solutions for your needs.
        </p>
      </div>

      <div className="cp-content">
        <div className="cp-grid">
          <div className="cp-card">
            <div className="cp-icon-wrapper">
              <Mail size={24} className="cp-icon" />
            </div>
            <h2 className="cp-card-title">Email Us</h2>
            <p className="cp-card-text">Reach out via email at your convenience, and our team will get back to you as quickly as possible.</p>
            <a href="mailto:dermasisremedies@gmail.com" className="cp-link" style={{ fontSize: '15px' }}>dermasisremedies@gmail.com</a>
            <span>Or</span>
            <a href="mailto:lethwala.anil@gmail.com" className="cp-link" style={{ fontSize: '15px' }}>lethwala.anil@gmail.com</a>
          </div>

          <div className="cp-card">
            <div className="cp-icon-wrapper">
              <Phone size={24} className="cp-icon" />
            </div>
            <h2 className="cp-card-title">Call Us</h2>
            <p className="cp-card-text">Speak directly with our support specialists during standard business hours for immediate assistance.</p>
            <a href="tel:+919974907955" className="cp-link">+91 99749 07955</a>
          </div>

          <div className="cp-card">
            <div className="cp-icon-wrapper">
              <MapPin size={24} className="cp-icon" />
            </div>
            <h2 className="cp-card-title">Headquarters</h2>
            <p className="cp-card-text">Visit our main office for official inquiries, corporate consultations, and strategic partnerships.</p>
            <div className="cp-address">
              <a href="https://maps.app.goo.gl/6hJLZGtn2WT9r6vU9" className="cp-link"><span>218, Crystal Plaza,</span>
              <span>SRT, Gujarat, India, 395010</span></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
