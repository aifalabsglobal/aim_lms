import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your AIM LMS account",
};

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center">
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/signin"
        forceRedirectUrl="/trainings"
      />
    </div>
  );
}
