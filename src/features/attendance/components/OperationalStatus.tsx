import { Check, Clock3, RefreshCw } from "lucide-react";

export function OperationalStatus() {
  return (
    <section className="panel-surface flex flex-col justify-between p-5 sm:p-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#6a8178]">
          <span className="h-2 w-2 rounded-full bg-[#7eaa85] shadow-[0_0_0_4px_rgba(126,170,133,0.13)]" />
          Quietly working
        </div>
        <h3 className="mt-3 max-w-[250px] font-display text-[22px] leading-tight tracking-[-0.04em] text-[#23443b]">
          The background work is taken care of.
        </h3>
        <p className="mt-3 max-w-[270px] text-[12px] leading-relaxed text-[#83938b]">
          Your attendance session is open and collecting responses normally.
        </p>
      </div>
      <div className="mt-7 space-y-3 border-t border-[#e5e6df] pt-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#617970]">
          <Check size={14} className="text-[#6e9a78]" />
          Last updated just now
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#617970]">
          <Clock3 size={14} className="text-[#8ba198]" />
          Session closes at 22:30
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#617970]">
          <RefreshCw size={14} className="text-[#8ba198]" />
          Updates automatically
        </div>
      </div>
    </section>
  );
}