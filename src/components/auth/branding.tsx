import Link from "next/link";

export function AuthBranding() {
  return (
    <div className="flex flex-col items-center gap-2 mb-8">
      <span
        className="text-[#c99743] text-4xl leading-none rotate-45 inline-block"
        aria-hidden="true"
      >
        ♢
      </span>
      <h1 className="font-['Georgia',serif] text-xl tracking-[0.13em] text-[#151513]">
        HOUSE OF LOTUS
      </h1>
      <span className="font-[Arial,sans-serif] text-[7px] tracking-[0.42em] text-[#756e62]">
        CANADA
      </span>
    </div>
  );
}

export function AuthFooter() {
  return (
    <p className="text-center text-[11px] text-[#756e62] leading-relaxed">
      By continuing, you agree to our{" "}
      <Link
        href="/terms"
        className="text-[#c99743] underline underline-offset-2 hover:text-[#c76331] transition-colors"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="text-[#c99743] underline underline-offset-2 hover:text-[#c76331] transition-colors"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
