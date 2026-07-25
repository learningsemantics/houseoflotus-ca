export function AuthBranding() {
  return (
    <div className="mb-8 text-center">
      <span className="text-[#c99743] text-3xl leading-none inline-block rotate-45" aria-hidden="true">♢</span>
      <h1 className="font-[Georgia,serif] text-xl tracking-[0.13em] text-[#151513] mt-3">
        HOUSE OF LOTUS
      </h1>
      <p className="text-[7px] tracking-[0.42em] text-[#756e62] uppercase mt-1">Canada</p>
    </div>
  )
}

export function AuthFooter() {
  return (
    <p className="text-center text-xs text-[#8e8579] mt-8">
      © {new Date().getFullYear()} House of Lotus Canada
    </p>
  )
}