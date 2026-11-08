import { ChevronDown } from "lucide-react";
import { qaBlocks } from "./placeholders";

export default function RefQuestions() {
  return (
    <section className="py-16 bg-white text-neutral-900 overflow-hidden relative border-t border-neutral-100">
      <div className="max-w-3xl mx-auto relative z-10">
        <header className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-neutral-950">Sıkça Sorulan Sorular</h2>
          <div className="w-10 h-[1px] bg-neutral-200 mx-auto mt-6" />
        </header>
        <div className="space-y-3">
          {qaBlocks.map((block, index) => {
            const open = index === 0;
            return (
              <div
                key={index}
                className={`border rounded-2xl transition-all duration-300 ${
                  open ? "border-neutral-200" : "border-neutral-100 bg-transparent"
                }`}
              >
                <div className="w-full px-6 py-5 flex items-center justify-between text-left">
                  <span className="text-base font-medium tracking-tight">
                    <span className="text-[10px] font-mono mr-4 text-neutral-400">0{index + 1}</span>
                    {block.q}
                  </span>
                  <ChevronDown
                    className={`text-neutral-400 w-5 h-5 transition-all duration-500 ${open ? "-scale-y-100" : ""}`}
                  />
                </div>
                {open && (
                  <div className="pr-6 py-6 pl-12 border-t border-neutral-200">
                    <p className="text-neutral-600 text-[15px] font-normal leading-relaxed max-w-2xl italic">
                      &quot;{block.a}&quot;
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
