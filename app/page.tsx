import { Crown } from "@/components/chapters/Crown";
import { Hold } from "@/components/chapters/Hold";
import { Part } from "@/components/chapters/Part";
import { Reach } from "@/components/chapters/Reach";
import { Settle } from "@/components/chapters/Settle";
import { Still } from "@/components/chapters/Still";
import { SiteFooter } from "@/components/SiteFooter";

export default function Page() {
  return (
    <>
      <main>
        <Still />
        <Reach />
        <Crown />
        <Part />
        <Hold />
        <Settle />
      </main>
      <SiteFooter />
    </>
  );
}
