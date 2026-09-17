import ShinyText from './ShinyText';

export default function HeroTitle() {
  return (
    <div className="hero-center" id="heroCenter">
      <p className="hero-kicker">RJDLx</p>
      <h1 className="hero-title fold-text" aria-label="INDIA, DESIGNED for the world.">
        <span className="fold-line">
          <ShinyText
            text="INDIA,"
            speed={2.5}
            delay={0.2}
            color="#f7f2e8"
            shineColor="#ffffff"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
          />
        </span>
        <span className="fold-line">
          <ShinyText
            text="DESIGNED"
            speed={2.5}
            delay={0.2}
            color="#f7f2e8"
            shineColor="#ffffff"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
          />
        </span>
        <span className="fold-line italic">
          <ShinyText
            text="for the world."
            speed={2.5}
            delay={0.2}
            color="#f7f2e8"
            shineColor="#ffffff"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
          />
        </span>
      </h1>
      <p className="hero-sub">Architect-driven design. Indian making. Global reach.</p>
    </div>
  );
}
