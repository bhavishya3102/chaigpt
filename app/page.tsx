import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Home() {
  return (
    <>
      <header className="flex h-16 items-center justify-end gap-4 p-4">
        <Show when="signed-out">
          <SignInButton mode="redirect" forceRedirectUrl="/">
            <button className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium sm:text-base">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl="/">
            <button className="h-10 cursor-pointer rounded-full bg-[#6c47ff] px-4 text-sm font-medium text-white sm:h-12 sm:px-5 sm:text-base">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <h1>Hello World</h1>
        <ModeToggle />
      </div>
    </>
  );
}
