export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-[#E5E5E5] bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
