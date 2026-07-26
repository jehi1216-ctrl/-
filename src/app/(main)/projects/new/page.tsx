import ProjectForm from "@/components/ProjectForm";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">새 프로젝트</h1>
        <p className="text-sm text-gray-500">현장 정보를 입력하세요.</p>
      </div>
      <ProjectForm action={createProject} submitLabel="프로젝트 만들기" />
    </div>
  );
}
