import { Briefcase } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function RecruitingPage() {
    return (
        <PillarPage
            pillarName="Recruiting"
            pillarCategory="Recruiting"
            pillarDescription="Manage candidate screening, interviews, and hiring processes"
            pillarIcon={<Briefcase size={28} />}
        />
    );
}
