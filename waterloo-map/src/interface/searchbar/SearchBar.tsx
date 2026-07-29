import { Input } from "@/components/ui/input";

export function SearchBar() {
  return (
    <div className="absolute top-4 left-6 w-80 h-12 z-1">
      <Input
        className="bg-white w-full h-full rounded-4xl py-2 px-6"
        placeholder="Search WaterlooMap"
      />
    </div>
  );
}
