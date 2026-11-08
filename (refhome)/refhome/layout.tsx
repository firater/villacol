import "./refhome.css";
import RefMobileSearchBar from "./components/RefMobileSearchBar";
import RefMobileBottomNav from "./components/RefMobileBottomNav";
import RefDesktopNav from "./components/RefDesktopNav";
import RefSiteFooter from "./components/RefSiteFooter";

export const metadata = {
  title: "Ref Home (isolated preview)",
  robots: { index: false, follow: false },
};

export default function RefHomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="refhome-root min-h-screen flex flex-col">
      <div className="md:hidden sticky top-0 z-[50]">
        <RefMobileSearchBar />
      </div>
      <div className="md:hidden">
        <RefMobileBottomNav />
      </div>
      <div className="ref-container mx-auto px-4 flex-grow w-full ref-mobile-content-pad">
        <div className="hidden md:block">
          <RefDesktopNav />
        </div>
        {children}
      </div>
      <RefSiteFooter />
    </div>
  );
}
