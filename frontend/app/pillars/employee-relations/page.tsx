import { Users } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function EmployeeRelationsPage() {
    return (
        <PillarPage
            pillarName="Employee Relations"
            pillarCategory="Employee_Relations"
            pillarDescription="Handle employee concerns, conflicts, and workplace culture"
            pillarIcon={<Users size={28} />}
        />
    );
}
