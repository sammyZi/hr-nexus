import { GraduationCap } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function LearningDevelopmentPage() {
    return (
        <PillarPage
            pillarName="Learning & Development"
            pillarCategory="Learning_Development"
            pillarDescription="Organize training programs, workshops, and career development"
            pillarIcon={<GraduationCap size={28} />}
        />
    );
}
