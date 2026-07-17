"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

const products = [
  { name: "Afterglow", note: "Sunset state of mind.", profile: "Cacao · orange peel · caramel", price: 24, format: "6 × 250 mL", tone: "#d66c35" },
  { name: "Night Bloom", note: "Bloom in the quiet.", profile: "Dark chocolate · plum · spice", price: 24, format: "6 × 250 mL", tone: "#9b829e" },
  { name: "Golden Hour", note: "Chase light, not people.", profile: "Honey · citrus · toasted almond", price: 24, format: "6 × 250 mL", tone: "#dda846" },
  { name: "Peak Mode", note: "Focus. Fuel. Finish.", profile: "Bold cacao · molasses · walnut", price: 24, format: "6 × 250 mL", tone: "#71836d" },
];

const buyers = [
  ["Specialty retail", "A rotating Indian-origin shelf with producer stories and staff-ready tasting notes."],
  ["Cafés & restaurants", "Roasted coffee, concentrate and service formats built for consistent margins."],
  ["Workplaces & hospitality", "Cold brew, gifting and pantry programs that make everyday service feel considered."],
];

function Lotus({ small = false }: { small?: boolean }) {
  return <span className={small ? "lotus small" : "lotus"} aria-hidden="true">♢</span>;
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const total = useMemo(() => cart.length * 24, [cart]);

  function add(name: string) {
    setCart((items) => [...items, name]);
    setNotice(`${name} added to your tasting box.`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function email(subject: string, body: string) {
    setNotice("Opening your email app to complete the request.");
    window.location.href = `mailto:hello@houseoflotus.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.setTimeout(() => setNotice(""), 3200);
  }

  return (
    <main>
      <div className="announcement">Canadian launch · Founding partners and early access now open</div>
      <header className="nav-wrap">
        <a className="brand" href="#top" aria-label="House of Lotus home">
          <Lotus />
          <span>HOUSE OF LOTUS<small>CANADA</small></span>
        </a>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? "Close" : "Menu"}</button>
        <nav className={menu ? "nav-links open" : "nav-links"}>
          <a href="#shop">Shop</a><a href="#origins">Our growers</a><a href="#wholesale">Wholesale</a><a href="#story">Journal</a>
        </nav>
        <a className="cart-link" href="#shop">Tasting box <span>{cart.length}</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy reveal">
          <p className="eyebrow">India, in its finest light</p>
          <h1>Remarkable coffee.<br/><em>Rooted at origin.</em></h1>
          <p className="lede">We bring the depth and diversity of Indian coffee to Canada—partnering with growers, building their market, and crafting modern cold brews and botanical elixirs of our own.</p>
          <div className="actions"><a className="button gold" href="#shop">Explore the collection</a><a className="text-link" href="#wholesale">Source for your business <span>↗</span></a></div>
          <div className="hero-proof"><span>Direct grower relationships</span><span>Selected for Canada</span><span>Crafted in small batches</span></div>
        </div>
        <div className="hero-visual">
          <Image src="/assets/hol-canada-launch.webp" alt="House of Lotus Afterglow cold brew formats" width={1536} height={1024} priority />
          <div className="image-caption"><span>01</span><p>AFTERGLOW<br/><small>Our signature cold brew</small></p></div>
        </div>
      </section>

      <section className="manifesto" id="origins">
        <p className="eyebrow">A new chapter for Indian coffee</p>
        <h2>Beyond a country of origin.<br/>A world of <em>distinct origins.</em></h2>
        <p>From misted estates in the Western Ghats to family-run farms shaping the next generation, India’s coffee landscape deserves a fuller stage. House of Lotus is the bridge: representing exceptional growers and translating their work for Canadian cups, shelves, and menus.</p>
        <div className="manifesto-stats"><div><strong>01</strong><span>Grower-first sourcing</span></div><div><strong>02</strong><span>Traceable lots & stories</span></div><div><strong>03</strong><span>Canadian market stewardship</span></div></div>
      </section>

      <section className="collection" id="shop">
        <div className="section-head"><div><p className="eyebrow">The cold brew collection</p><h2>Every mood has<br/><em>its ritual.</em></h2></div><p>Small-batch, low-acidity cold brew. Built for slow mornings, hard climbs, late chapters, and everything between.</p></div>
        <div className="product-grid">
          {products.map((p, i) => <article className="product" key={p.name}>
            <div className="can-stage"><div className="mini-can" style={{"--accent": p.tone} as React.CSSProperties}><Lotus small/><b>HOUSE OF LOTUS</b><small>COLD BREW</small><span className="can-orb">{i % 2 ? "☾" : "☀"}</span><strong>{p.name}</strong></div><span className="product-number">0{i+1}</span></div>
            <div className="product-info"><div><h3>{p.name}</h3><p>{p.note}</p><small>{p.profile}</small></div><button onClick={() => add(p.name)} aria-label={`Add ${p.name}`}>+</button></div>
            <div className="price"><span>{p.format}</span><span>${p.price} CAD</span></div>
          </article>)}
        </div>
        <div className="collection-foot"><p>{cart.length ? `${cart.length} pack${cart.length === 1 ? "" : "s"} · $${total} CAD` : "Build a mixed tasting box"}</p><button className="button outline" onClick={() => add("Discovery Selection")}>Add discovery selection</button></div>
      </section>

      <section className="rtd-story" id="story">
        <div className="rtd-image"><Image src="/assets/hol-rtd-collection.webp" alt="Ten House of Lotus cold brew designs" width={1536} height={1024} /></div>
        <div className="rtd-copy"><p className="eyebrow">Made by House of Lotus</p><h2>Cold brew with<br/><em>a point of view.</em></h2><p>Our RTD collection pairs Indian coffee with a contemporary Canadian rhythm. Each expression begins with a mood, then earns its flavour through thoughtful sourcing and patient extraction.</p><dl><div><dt>250 mL</dt><dd>Ready-to-drink cans</dd></div><div><dt>1 L</dt><dd>Fridge-ready cartons</dd></div><div><dt>2.8 L</dt><dd>Bag-in-box for service</dd></div><div><dt>8–10</dt><dd>Dry dipping servings</dd></div></dl><a className="text-link light" href="#access">Join the first release <span>→</span></a></div>
      </section>

      <section className="wholesale" id="wholesale">
        <div className="wholesale-intro"><p className="eyebrow">For Canadian businesses</p><h2>More than supply.<br/><em>A partnership at origin.</em></h2><p>Choose from curated grower coffees and House of Lotus formats, supported by sourcing guidance, product education, and a story your customers can believe in.</p><button className="button dark" onClick={() => email("House of Lotus wholesale access", "Business name:\nBuyer type:\nCity / Province:\nProducts of interest:\nEstimated monthly volume:\n")}>Request wholesale access</button></div>
        <div className="buyer-list">{buyers.map(([title, body], i) => <article key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{body}</p></div><b>↗</b></article>)}</div>
      </section>

      <section className="access" id="access">
        <Lotus/><p className="eyebrow">The first pour</p><h2>Be here at the beginning.</h2><p>Early access to new grower releases, House of Lotus cold brews, tasting events, and founding partner opportunities across Canada.</p>
        <form onSubmit={(e) => {e.preventDefault(); const form = new FormData(e.currentTarget); email("House of Lotus Canada early access", `Please add me to early access.\n\nEmail: ${form.get("email")}\nI am a: ${form.get("audience")}`);}}><input name="email" type="email" required placeholder="Email address" aria-label="Email address"/><select name="audience" aria-label="I am a"><option>Coffee drinker</option><option>Café or restaurant</option><option>Retail buyer</option><option>Office or hotel</option></select><button>Join the list →</button></form>
      </section>

      <footer><div className="footer-brand"><Lotus/><span>HOUSE OF LOTUS<small>INDIAN COFFEE · CANADIAN TABLES</small></span></div><div><h4>Explore</h4><a href="#shop">Cold brew</a><a href="#origins">Growers</a><a href="#story">Our story</a></div><div><h4>Partner</h4><a href="#wholesale">Wholesale</a><a href="#wholesale">Hospitality</a><a href="#access">Stockists</a></div><div><h4>Follow</h4><a href="#access">Instagram</a><a href="#access">LinkedIn</a><a href="mailto:hello@houseoflotus.ca">Email</a></div><p className="legal">© 2026 House of Lotus Canada · Toronto, Ontario<br/>Built in Canada. Rooted in India.</p></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
