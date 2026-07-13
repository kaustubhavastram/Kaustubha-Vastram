import { useState, useEffect } from "react";
import discountImg from "../../logo/promo-portrait.jpeg";
import "../../styles/promo-modal.css";

export default function PromoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    // Show modal once per session
    const hasSeenPromo = sessionStorage.getItem("hasSeenPromo");
    
    if (!hasSeenPromo) {
      setIsOpen(true);
      sessionStorage.setItem("hasSeenPromo", "true");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setCanClose(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="promo-modal-overlay">
      <div className="promo-modal-content">
        <img src={discountImg} alt="Special Discount Offer" className="promo-modal-image" />
        
        {canClose && (
          <button className="promo-modal-close" onClick={() => setIsOpen(false)} aria-label="Close promo">
            &times;
          </button>
        )}
        
        {canClose && (
          <div className="promo-modal-action">
            <button className="btn btn--dark promo-modal-continue" onClick={() => setIsOpen(false)}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
