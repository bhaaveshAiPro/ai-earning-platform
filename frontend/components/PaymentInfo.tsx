"use client";

export default function PaymentInfo() {
  return (
    <div className="space-y-3 text-xs text-slate-200">
      <div>
        <h4 className="font-semibold text-slate-100 mb-1">PayPal</h4>
        <p className="text-slate-300">Send payment via PayPal to:</p>

        <p className="mt-1">
          <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-1 border border-slate-700 font-mono text-[11px]">
            bhaaveshsonaram@gmail.com
          </span>
        </p>

        <p className="mt-1 text-[11px] text-slate-500">
          Add a note with your <span className="font-mono">email</span> so we can
          match your account.
        </p>
      </div>

      <div className="border-t border-slate-800 pt-3">
        <h4 className="font-semibold text-slate-100 mb-1">Bank transfer</h4>
        <p className="text-[11px] text-slate-400">
          Coming soon. For now use PayPal.
        </p>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        After customer pays, admin approves and credits are added.
      </p>
    </div>
  );
}
