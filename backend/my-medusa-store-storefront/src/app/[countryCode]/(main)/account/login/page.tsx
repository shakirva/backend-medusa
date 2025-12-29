import LoginForm from "@modules/account/components/login-form"

export const metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <div className="px-6 py-10 md:px-8 lg:px-12 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <p className="text-sm text-neutral-600 mb-6">Use the demo credentials or your account to sign in.</p>
      <LoginForm />
      <div className="text-xs text-neutral-500 mt-6">
        Demo: customer@marqasouq.com / customer123
      </div>
    </div>
  )
}
