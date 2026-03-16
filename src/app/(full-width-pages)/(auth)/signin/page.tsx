import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your AIM LMS account",
};

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center">
      <SignIn
        path="/signin"
        routing="path"
        signUpUrl="/signup"
        forceRedirectUrl="/"
      />
    </div>
  );
}
