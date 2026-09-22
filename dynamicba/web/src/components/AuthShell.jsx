import React from 'react'
import { Sparkles } from 'lucide-react'

// Shared frame for the sign-in and account-creation screens: an asymmetric split
// with a dark editorial brand panel (the one deliberate exception to the app's
// otherwise always-light backgrounds) and a white panel carrying the form.
export default function AuthShell({ children, wide = false }) {
  return (
    <div className="min-h-screen flex bg-bg">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] bg-grey-dark text-white flex-col justify-between px-12 py-16">
        <div>
          <div className="font-serif font-bold text-2xl">DynamicBA</div>
          <div className="eyebrow text-orange mt-1">Scope-to-Specs Automation</div>
        </div>
        <div className="max-w-sm">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-orange mb-6">
            <Sparkles size={22} strokeWidth={2} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="font-serif font-bold text-3xl leading-tight mb-4">
            From signed scope to reviewed specification, in four steps.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            DynamicBA turns a Statement of Work into an automation opportunity assessment,
            future-state design, and specification package — drafted with AI assistance,
            reviewed and approved by your own consulting team at every step.
          </p>
        </div>
        <p className="text-white/50 text-xs">© {new Date().getFullYear()} DynamicBA.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className={`card p-8 w-full ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
