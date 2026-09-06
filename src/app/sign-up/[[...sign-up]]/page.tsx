import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      {/* hash routing — see the note in sign-in/[[...sign-in]]/page.tsx */}
      <SignUp routing="hash" />
    </div>
  );
}
