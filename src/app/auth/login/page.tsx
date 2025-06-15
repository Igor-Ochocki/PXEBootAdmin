import LoginButton from '@/components/LoginButton'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="bg-primary p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-quinary mb-6 text-center">
          Welcome to PXE Boot Admin
        </h1>
        <p className="text-quinary mb-8 text-center">
          Please log in with your USOS account to continue
        </p>
        <div className="flex justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
