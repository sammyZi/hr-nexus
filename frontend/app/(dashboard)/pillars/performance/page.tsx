import { TrendingUp } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function PerformancePage() {
    return (
        <PillarPage
            pillarName="Performance"
            pillarCategory="Performance"
            pillarDescription="Conduct performance reviews, set goals, and track progress"
            pillarIcon={<TrendingUp size={28} />}
        />
    );
}
