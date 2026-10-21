import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 space-y-12 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-[420px] w-full bg-[#141414] border-b border-[#292929] flex items-center">
        <Container className="space-y-4">
          <div className="h-6 w-36 rounded-full bg-[#242424]" />
          <div className="h-12 w-2/3 max-w-lg rounded-xl bg-[#242424]" />
          <div className="h-4 w-1/3 rounded-lg bg-[#1F1F1F]" />
          <div className="h-16 w-3/4 max-w-xl rounded-lg bg-[#1F1F1F]" />
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-36 rounded-lg bg-[#292929]" />
            <div className="h-11 w-32 rounded-lg bg-[#1F1F1F]" />
          </div>
        </Container>
      </div>

      {/* Grid Skeleton */}
      <Container className="space-y-6">
        <div className="h-6 w-48 rounded-lg bg-[#242424]" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col space-y-3 rounded-xl border border-[#292929] bg-[#171717] p-3"
            >
              <div className="aspect-[2/3] w-full rounded-lg bg-[#242424]" />
              <div className="h-4 w-3/4 rounded bg-[#242424]" />
              <div className="h-3 w-1/2 rounded bg-[#1F1F1F]" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
