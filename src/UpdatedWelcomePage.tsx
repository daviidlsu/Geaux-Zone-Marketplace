import React, { useState, useEffect, useRef } from "react";

// Product type
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string;
}

// Product Card with fade-in + slide-up + stagger
const ProductCard: React.FC<{
  product: Product;
  onAdd: (product: Product) => void;
  index: number;
}> = ({ product, onAdd, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 150);
        }
      },
      { threshold: 0.2 }
    );

    const currentCard = cardRef.current;
    if (currentCard) observer.observe(currentCard);

    return () => {
      if (currentCard) observer.unobserve(currentCard);
    };
  }, [index]);

  return (
    <div
      ref={cardRef}
      style={{
        background: "rgba(70, 29, 124, 0.3)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(253, 208, 35, 0.2)",
        padding: "20px",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
        opacity: isVisible ? 1 : 0,
        transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(253, 208, 35, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
      }}
    >
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          style={{ width: "100%", borderRadius: "12px", marginBottom: "12px" }}
        />
      )}
      <h4 style={{ color: "#FDD023", marginBottom: "6px", fontSize: "1.2rem" }}>{product.name}</h4>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "8px", fontSize: "0.9rem" }}>
        {product.category}
      </p>
      <p style={{ color: "#FFFFFF", marginBottom: "16px", fontSize: "1.4rem", fontWeight: "700" }}>
        ${product.price}
      </p>
      <button
        onClick={() => onAdd(product)}
        style={{
          background: "linear-gradient(135deg, #FDD023 0%, #FDB913 100%)",
          color: "#461D7C",
          padding: "10px 20px",
          borderRadius: "10px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          width: "100%",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(253, 208, 35, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default function UpdatedWelcomePage() {
  const [cart, setCart] = useState<Product[]>([]);

  const products: Product[] = [
    { id: 1, name: "Nightwave Hoodie", price: 68, category: "Apparel" },
    { id: 2, name: "Geaux Cap", price: 28, category: "Accessories" },
    { id: 3, name: "Gradient Tumbler", price: 22, category: "Drinkware" },
    { id: 4, name: "Zone Poster", price: 16, category: "Decor" },
    { id: 5, name: "Grit Tee", price: 34, category: "Apparel" },
    { id: 6, name: "Glow Pin Set", price: 12, category: "Accessories" },
  ];

  const addToCart = (product: Product) => setCart([...cart, product]);
  const total = cart.reduce((sum, p) => sum + p.price, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #2d1b4e 100%);
          background-attachment: fixed;
          color: white;
          overflow-x: hidden;
        }
        
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(70, 29, 124, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(253, 208, 35, 0.15) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        
        .header {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 60px 20px 40px;
          background: linear-gradient(180deg, rgba(70, 29, 124, 0.6) 0%, transparent 100%);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(253, 208, 35, 0.2);
        }
        
        .logo {
          display: block;
          margin: 0 auto 20px;
          width: 100px;
          height: 100px;
          filter: drop-shadow(0 0 20px rgba(253, 208, 35, 0.5));
        }
        
        .hero h1 {
          font-size: 3.5rem;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #FDD023 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          letter-spacing: -1px;
        }
        
        .hero p {
          font-size: 1.3rem;
          margin-bottom: 32px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 400;
        }
        
        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .cta-buttons button {
          transition: all 0.3s ease;
        }
        
        .products-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          padding: 60px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .cart-bubble {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #461D7C 0%, #6B2FB5 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(70, 29, 124, 0.5);
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          overflow: hidden;
        }
        
        .cart-bubble:hover {
          width: 320px;
          border-radius: 30px;
          box-shadow: 0 8px 40px rgba(70, 29, 124, 0.7);
        }
        
        .cart-icon {
          min-width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #FDD023;
        }
        
        .cart-content {
          opacity: 0;
          width: 0;
          transition: opacity 0.3s ease 0.1s;
          padding: 0;
          overflow: hidden;
        }
        
        .cart-bubble:hover .cart-content {
          opacity: 1;
          width: 240px;
          padding: 0 20px 0 0;
        }
        
        .cart-item {
          font-size: 0.9rem;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .cart-total {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(253, 208, 35, 0.3);
          font-weight: 700;
          color: #FDD023;
        }
        
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          .products-grid {
            padding: 40px 20px;
          }
        }
      `}</style>

      {/* Cart Bubble */}
      <div className="cart-bubble">
        <div className="cart-icon">
          🛒 <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>{cart.length}</span>
        </div>
        <div className="cart-content">
          {cart.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>Cart is empty</div>
          ) : (
            <>
              {cart.map((p, idx) => (
                <div key={idx} className="cart-item">
                  {p.name} — ${p.price}
                </div>
              ))}
              <div className="cart-total">Total: ${total}</div>
            </>
          )}
        </div>
      </div>

      {/* Header with centered logo */}
      <header className="header">
        <img src="/geauxzone_tiger.png" alt="Geaux Zone Logo" className="logo" />
        <div className="hero">
          <h1>Welcome to Geaux Zone</h1>
          <p>The LSU Student Marketplace — Buy. Sell. Geaux.</p>
          <div className="cta-buttons">
            <button
              style={{
                background: "linear-gradient(135deg, #FDD023 0%, #FDB913 100%)",
                color: "#461D7C",
                padding: "14px 32px",
                borderRadius: "12px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(253, 208, 35, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Shop Now
            </button>
            <button
              style={{
                background: "transparent",
                border: "2px solid #FDD023",
                color: "#FDD023",
                padding: "14px 32px",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(253, 208, 35, 0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onClick={() => alert("Join feature coming soon!")}
            >
              Join the Drop List
            </button>
          </div>
        </div>
      </header>

      {/* Product Grid with staggered fade-in + slide-up */}
      <section id="products" className="products-grid">
        {products.map((p, idx) => (
          <ProductCard key={p.id} product={p} onAdd={addToCart} index={idx} />
        ))}
      </section>
    </>
  );
}