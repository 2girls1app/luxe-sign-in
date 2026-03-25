import logoImg from "@/assets/logo.png";

const Logo = () => (
  <div className="flex flex-col items-center gap-3 opacity-40">
    <img src={logoImg} alt="Advanced Surgical Solutions" className="w-64 h-64 object-contain" />
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold tracking-[3px] text-primary">
        ADVANCED SURGICAL
      </span>
      <span className="text-sm font-bold tracking-[4px] text-primary">
        SOLUTIONS
      </span>
      <span className="text-[10px] tracking-[2px] text-primary/70 mt-1">
        EST. 2009
      </span>
    </div>
  </div>
);

export default Logo;
