//app/(auth)/layout.tsx
//
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-700 via-teal-700 to-cyan-800 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}